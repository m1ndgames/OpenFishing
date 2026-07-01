import { createHash, createHmac, randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { eq, isNull, or } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import {
	user,
	lure,
	spot,
	fishCatch,
	rod,
	reel,
	fishingLine,
	combo,
	chatMessage
} from '$lib/server/db/schema';

const scrypt = promisify(_scrypt);

const SESSION_COOKIE = 'of_session';
const ADMIN_USERNAME = 'admin';
/** Default upload quota for new users, in bytes (500 MB). */
export const DEFAULT_QUOTA_BYTES = 500 * 1024 * 1024;

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

/**
 * The admin password / server auth secret. Prefers `ADMIN_PASSWORD`; falls back to the
 * deprecated `AUTH_PASSWORD` for backward compatibility. Returns undefined (auth disabled,
 * open mode) when neither is set.
 */
export function getAdminPassword(): string | undefined {
	return env.ADMIN_PASSWORD || env.AUTH_PASSWORD || undefined;
}

/** Whether multi-user auth is enabled (a password is configured). */
export function authEnabled(): boolean {
	return !!getAdminPassword();
}

/** Shape attached to `event.locals.user`. */
export interface SessionUser {
	id: string;
	email: string | null;
	username: string;
	isAdmin: boolean;
	disabled: boolean;
	quotaBytes: number | null;
	usedBytes: number;
	chatbotEnabled: boolean;
	apiToken: string | null;
}

// ── Password hashing (scrypt) ───────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16);
	const derived = (await scrypt(password, salt, 64)) as Buffer;
	return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
	const [saltHex, hashHex] = stored.split(':');
	if (!saltHex || !hashHex) return false;
	const salt = Buffer.from(saltHex, 'hex');
	const expected = Buffer.from(hashHex, 'hex');
	const derived = (await scrypt(password, salt, expected.length)) as Buffer;
	return expected.length === derived.length && timingSafeEqual(expected, derived);
}

// ── Session cookie (stateless, signed) ──────────────────────────────────────────

function signature(userId: string, passwordHash: string): string {
	// Keyed on the admin password (server secret) and bound to the user's password hash,
	// so changing either the global password or the user's password invalidates old cookies.
	const key = getAdminPassword() ?? '';
	return createHmac('sha256', key).update(`${userId}:${passwordHash}`).digest('hex');
}

export function sessionCookieValue(u: { id: string; passwordHash: string }): string {
	return `${u.id}.${signature(u.id, u.passwordHash)}`;
}

function safeEqualHex(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	try {
		return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
	} catch {
		return false;
	}
}

/** Resolve and verify a session cookie value into a SessionUser, or null. */
export async function resolveSessionUser(cookieValue: string | undefined): Promise<SessionUser | null> {
	if (!cookieValue) return null;
	const dot = cookieValue.indexOf('.');
	if (dot < 0) return null;
	const userId = cookieValue.slice(0, dot);
	const sig = cookieValue.slice(dot + 1);

	const row = await db.query.user.findFirst({ where: eq(user.id, userId) });
	if (!row || row.disabled) return null;
	if (!safeEqualHex(sig, signature(row.id, row.passwordHash))) return null;
	return toSessionUser(row);
}

/** Look up a user for login by email (case-insensitive) or username. */
export async function findUserByIdentifier(identifier: string) {
	const id = identifier.trim();
	if (!id) return undefined;
	return db.query.user.findFirst({
		where: or(eq(user.email, id.toLowerCase()), eq(user.username, id))
	});
}

/** Look up a user by email only (for password reset). Null/blank never matches. */
export async function findUserByEmail(email: string) {
	const e = email.trim().toLowerCase();
	if (!e) return undefined;
	return db.query.user.findFirst({ where: eq(user.email, e) });
}

export function toSessionUser(row: typeof user.$inferSelect): SessionUser {
	return {
		id: row.id,
		email: row.email,
		username: row.username,
		isAdmin: row.isAdmin,
		disabled: row.disabled,
		quotaBytes: row.quotaBytes,
		usedBytes: row.usedBytes,
		chatbotEnabled: row.chatbotEnabled,
		apiToken: row.apiToken
	};
}

// ── API tokens ──────────────────────────────────────────────────────────────────

export function generateApiToken(): string {
	return randomBytes(24).toString('hex');
}

// ── Password reset tokens ────────────────────────────────────────────────────────

/** How long a password-reset link stays valid. */
export const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/** A raw reset token (emailed to the user) and the SHA-256 hash stored in the DB. */
export function generateResetToken(): { token: string; hash: string; expiry: Date } {
	const token = randomBytes(32).toString('hex');
	return { token, hash: hashResetToken(token), expiry: new Date(Date.now() + RESET_TOKEN_TTL_MS) };
}

export function hashResetToken(token: string): string {
	return createHash('sha256').update(token).digest('hex');
}

// ── Admin provisioning ──────────────────────────────────────────────────────────

let provisioning: Promise<void> | null = null;

/**
 * Idempotent startup sync of the admin account from env. Creates the admin if missing,
 * otherwise re-syncs only its password, then claims any orphan (userId IS NULL) rows for
 * the admin. Runs at most once per process.
 */
export function ensureAdminUser(): Promise<void> {
	if (!provisioning) provisioning = provisionAdmin();
	return provisioning;
}

/**
 * Ensure the admin account exists and matches env. The admin is intentionally minimal:
 * fixed username `admin`, **no email** (it can't self-reset), and its password comes from
 * `ADMIN_PASSWORD` (falling back to `AUTH_PASSWORD`). All three are re-synced every boot so
 * the admin can never lock itself out. Returns the admin id, or null when auth is disabled.
 * Safe to call any time — used at startup and after an admin "restore all".
 */
export async function syncAdminFromEnv(): Promise<string | null> {
	const password = getAdminPassword();
	if (!password) return null;

	const existing = await db.query.user.findFirst({ where: eq(user.isAdmin, true) });
	const passwordHash = await hashPassword(password);

	if (!existing) {
		const [created] = await db
			.insert(user)
			.values({ email: null, username: ADMIN_USERNAME, passwordHash, isAdmin: true, quotaBytes: null, apiToken: generateApiToken() })
			.returning({ id: user.id });
		return created.id;
	}

	// Force the admin's identity back to the env-controlled values every boot.
	await db
		.update(user)
		.set({ passwordHash, username: ADMIN_USERNAME, email: null, apiToken: existing.apiToken ?? generateApiToken(), updatedAt: new Date() })
		.where(eq(user.id, existing.id));
	return existing.id;
}

/** Re-sync the env admin after a destructive restore (so admin login always works). */
export async function reprovisionAdmin(): Promise<void> {
	await syncAdminFromEnv();
}

async function provisionAdmin(): Promise<void> {
	const adminId = await syncAdminFromEnv();
	if (adminId) await claimOrphanRows(adminId);
}

async function claimOrphanRows(adminId: string): Promise<void> {
	const owned = [lure, spot, fishCatch, rod, reel, fishingLine, combo, chatMessage] as const;
	for (const table of owned) {
		await db.update(table).set({ userId: adminId }).where(isNull(table.userId));
	}
}
