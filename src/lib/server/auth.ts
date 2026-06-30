import { createHmac, randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
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
const DEFAULT_ADMIN_EMAIL = 'admin@openfishing.local';
/** Default upload quota for new users, in bytes (500 MB). */
export const DEFAULT_QUOTA_BYTES = 500 * 1024 * 1024;

export const SESSION_COOKIE_NAME = SESSION_COOKIE;

/** Shape attached to `event.locals.user`. */
export interface SessionUser {
	id: string;
	email: string;
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
	// Keyed on AUTH_PASSWORD (server secret) and bound to the user's password hash,
	// so changing either the global password or the user's password invalidates old cookies.
	const key = env.AUTH_PASSWORD ?? '';
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

// ── Admin provisioning ──────────────────────────────────────────────────────────

let provisioning: Promise<void> | null = null;

/**
 * Idempotent startup sync of the admin account from env. Creates the admin if missing,
 * otherwise re-syncs its password (and email/username when free), then claims any
 * orphan (userId IS NULL) rows for the admin. Runs at most once per process.
 */
export function ensureAdminUser(): Promise<void> {
	if (!provisioning) provisioning = provisionAdmin();
	return provisioning;
}

/**
 * Ensure the env-controlled admin account exists and matches `ADMIN_EMAIL`/`AUTH_PASSWORD`.
 * Returns the admin id, or null when auth is disabled. Safe to call any time (no guard) —
 * used both at startup and after an admin "restore all" to guarantee the admin can log in.
 */
export async function syncAdminFromEnv(): Promise<string | null> {
	const password = env.AUTH_PASSWORD;
	if (!password) return null;
	const adminEmail = (env.ADMIN_EMAIL ?? DEFAULT_ADMIN_EMAIL).toLowerCase();

	const existing = await db.query.user.findFirst({ where: eq(user.isAdmin, true) });
	const passwordHash = await hashPassword(password);

	if (!existing) {
		const [created] = await db
			.insert(user)
			.values({ email: adminEmail, username: ADMIN_USERNAME, passwordHash, isAdmin: true, quotaBytes: null, apiToken: generateApiToken() })
			.returning({ id: user.id });
		return created.id;
	}

	// Password always re-syncs (cannot collide).
	await db.update(user).set({ passwordHash, updatedAt: new Date() }).where(eq(user.id, existing.id));
	// Email/username re-sync, tolerant of unique conflicts (pathological case).
	try {
		await db.update(user).set({ email: adminEmail, username: ADMIN_USERNAME }).where(eq(user.id, existing.id));
	} catch {
		/* another row already holds the admin email/username — leave as-is */
	}
	if (!existing.apiToken) {
		await db.update(user).set({ apiToken: generateApiToken() }).where(eq(user.id, existing.id));
	}
	return existing.id;
}

/** Re-sync the env admin after a destructive restore (so login with AUTH_PASSWORD always works). */
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
