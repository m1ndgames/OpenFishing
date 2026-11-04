import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import * as client from 'openid-client';
import { env } from '#lib/server/env.js';
import { db } from '#lib/server/db/index.js';
import { user } from '#lib/server/db/schema.js';
import { authEnabled, generateApiToken } from '#lib/server/auth.js';

/** Short-lived cookie carrying the PKCE verifier / state / nonce between redirect and callback. */
export const OIDC_FLOW_COOKIE = 'of_oidc';
export const OIDC_FLOW_MAX_AGE = 600;
export const OIDC_CALLBACK_PATH = '/login/oidc/callback';

export type OidcFlow = { state: string; nonce: string; verifier: string };

/** Why a login attempt was refused; surfaced to /login as `?oidc_error=<code>`. */
export type OidcErrorCode = 'failed' | 'no_account' | 'disabled' | 'denied';

export class OidcLoginError extends Error {
	constructor(public code: OidcErrorCode, message?: string) {
		super(message ?? code);
	}
}

/**
 * OIDC is on when an issuer, client id and secret are set *and* multi-user auth is enabled —
 * sessions are signed with the admin password, so OIDC can't exist in open mode.
 */
export function oidcEnabled(): boolean {
	return authEnabled() && !!env.OIDC_ISSUER && !!env.OIDC_CLIENT_ID && !!env.OIDC_CLIENT_SECRET;
}

export function oidcProviderName(): string {
	return env.OIDC_PROVIDER_NAME?.trim() || 'SSO';
}

function autoCreate(): boolean {
	return env.OIDC_AUTO_CREATE?.trim().toLowerCase() !== 'false';
}

/** The issuer as a normalised string, used as half of the stored identity key. */
export function oidcIssuer(): string {
	return (env.OIDC_ISSUER ?? '').trim().replace(/\/+$/, '');
}

/** Registered redirect URI. Built from BASE_URL (not the request) so it is proxy-proof. */
export function oidcRedirectUri(): string {
	return new URL(OIDC_CALLBACK_PATH, env.BASE_URL || 'http://localhost:5173').toString();
}

/**
 * Rebase a request URL onto BASE_URL's origin so the callback URL handed to the library
 * (which compares it to the registered redirect_uri) matches what the browser really used.
 */
export function rebaseOnBaseUrl(requestUrl: URL): URL {
	const base = new URL(env.BASE_URL || 'http://localhost:5173');
	const out = new URL(requestUrl.pathname + requestUrl.search, base);
	return out;
}

// ── Discovery (cached; retried after a failure) ─────────────────────────────────

let configPromise: Promise<client.Configuration> | null = null;
let configKey = '';

export function resetOidcConfigCache(): void {
	configPromise = null;
	configKey = '';
}

function getConfig(): Promise<client.Configuration> {
	const key = `${oidcIssuer()}|${env.OIDC_CLIENT_ID}|${env.OIDC_CLIENT_SECRET}`;
	if (!configPromise || key !== configKey) {
		configKey = key;
		const allowHttp = env.OIDC_ALLOW_HTTP?.trim().toLowerCase() === 'true';
		const p = client.discovery(
			new URL(oidcIssuer()),
			env.OIDC_CLIENT_ID!,
			env.OIDC_CLIENT_SECRET!,
			undefined,
			allowHttp ? { execute: [client.allowInsecureRequests] } : undefined
		);
		// Don't cache a failed discovery — the IdP may simply have been down at boot.
		p.catch(() => {
			if (configPromise === p) configPromise = null;
		});
		configPromise = p;
	}
	return configPromise;
}

// ── Authorization-code flow with PKCE ──────────────────────────────────────────

export async function beginOidcLogin(): Promise<{ url: URL; flow: OidcFlow }> {
	const config = await getConfig();
	const flow: OidcFlow = {
		state: client.randomState(),
		nonce: client.randomNonce(),
		verifier: client.randomPKCECodeVerifier()
	};
	const url = client.buildAuthorizationUrl(config, {
		redirect_uri: oidcRedirectUri(),
		scope: env.OIDC_SCOPES?.trim() || 'openid profile email',
		state: flow.state,
		nonce: flow.nonce,
		code_challenge: await client.calculatePKCECodeChallenge(flow.verifier),
		code_challenge_method: 'S256'
	});
	return { url, flow };
}

export function encodeFlow(flow: OidcFlow): string {
	return Buffer.from(JSON.stringify(flow)).toString('base64url');
}

export function decodeFlow(raw: string | undefined): OidcFlow | null {
	if (!raw) return null;
	try {
		const f = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
		if (typeof f?.state === 'string' && typeof f?.nonce === 'string' && typeof f?.verifier === 'string') {
			return { state: f.state, nonce: f.nonce, verifier: f.verifier };
		}
	} catch {
		/* fall through */
	}
	return null;
}

export type OidcClaims = {
	sub: string;
	email?: string;
	email_verified?: boolean;
	preferred_username?: string;
	name?: string;
};

/** Exchange the code, validate the ID token, and return the claims (userinfo fills gaps). */
export async function completeOidcLogin(callbackUrl: URL, flow: OidcFlow): Promise<OidcClaims> {
	const config = await getConfig();
	const tokens = await client.authorizationCodeGrant(config, callbackUrl, {
		pkceCodeVerifier: flow.verifier,
		expectedState: flow.state,
		expectedNonce: flow.nonce,
		idTokenExpected: true
	});
	const idClaims = tokens.claims();
	if (!idClaims?.sub) throw new OidcLoginError('failed', 'ID token has no sub claim');

	let claims: OidcClaims = idClaims as unknown as OidcClaims;
	// Many providers (Authelia among them) keep profile/email out of the ID token by default.
	if (!claims.email || !claims.preferred_username) {
		const info = await client.fetchUserInfo(config, tokens.access_token, idClaims.sub);
		claims = { ...claims, ...(info as unknown as OidcClaims), sub: idClaims.sub };
	}
	return claims;
}

// ── Mapping claims → local user ────────────────────────────────────────────────

function sanitiseUsername(raw: string): string {
	const cleaned = raw.trim().replace(/[^\p{L}\p{N}._-]+/gu, '_').replace(/^_+|_+$/g, '').slice(0, 40);
	return cleaned || 'user';
}

async function uniqueUsername(base: string): Promise<string> {
	let candidate = base;
	for (let n = 2; await db.query.user.findFirst({ where: eq(user.username, candidate) }); n++) {
		candidate = `${base}${n}`;
	}
	return candidate;
}

/**
 * Find or provision the local account for these claims.
 *
 *  1. Already linked (issuer + sub)         → that user.
 *  2. A local user has the same email, the provider vouches for it (`email_verified`), and
 *     that user is not linked to another identity → link it. Unverified emails are never
 *     trusted: that would let anyone who can register at the IdP take over a local account.
 *  3. Otherwise create a new user (unless OIDC_AUTO_CREATE=false).
 *
 * Throws OidcLoginError('no_account' | 'disabled') when login must be refused.
 */
export async function resolveOidcUser(claims: OidcClaims) {
	const issuer = oidcIssuer();
	const email = claims.email?.trim().toLowerCase() || null;

	const linked = await db.query.user.findFirst({
		where: and(eq(user.oidcIssuer, issuer), eq(user.oidcSubject, claims.sub))
	});
	if (linked) {
		if (linked.disabled) throw new OidcLoginError('disabled');
		return linked;
	}

	if (email && claims.email_verified === true) {
		const byEmail = await db.query.user.findFirst({ where: eq(user.email, email) });
		if (byEmail && !byEmail.oidcSubject && !byEmail.isAdmin) {
			if (byEmail.disabled) throw new OidcLoginError('disabled');
			await db
				.update(user)
				.set({ oidcIssuer: issuer, oidcSubject: claims.sub, updatedAt: new Date() })
				.where(eq(user.id, byEmail.id));
			return { ...byEmail, oidcIssuer: issuer, oidcSubject: claims.sub };
		}
	}

	if (!autoCreate()) throw new OidcLoginError('no_account');

	// An email that already belongs to a different local account must not be duplicated.
	const emailTaken = email ? await db.query.user.findFirst({ where: eq(user.email, email) }) : null;
	const base = sanitiseUsername(
		claims.preferred_username?.trim() || email?.split('@')[0] || claims.name?.trim() || 'user'
	);
	const username = await uniqueUsername(base);

	const [created] = await db
		.insert(user)
		.values({
			email: emailTaken ? null : email,
			username,
			// Not a valid "salt:hash", so password login can never succeed for this account.
			// (The session cookie is bound to this value, so it stays stable per user.)
			passwordHash: `oidc!${randomBytes(32).toString('hex')}`,
			isAdmin: false,
			quotaBytes: null,
			apiToken: generateApiToken(),
			oidcIssuer: issuer,
			oidcSubject: claims.sub
		})
		.returning();
	return created;
}
