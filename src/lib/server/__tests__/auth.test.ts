import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEnv: Record<string, string | undefined> = { AUTH_PASSWORD: 'secret', ADMIN_EMAIL: undefined };
let userRow: any = null;

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('$lib/server/db', () => ({
	db: { query: { user: { findFirst: vi.fn(async () => userRow) } } },
}));

const {
	hashPassword,
	verifyPassword,
	sessionCookieValue,
	resolveSessionUser,
	generateApiToken,
	findUserByIdentifier,
	findUserByEmail,
	generateResetToken,
	hashResetToken,
	toSessionUser
} = await import('../auth');

beforeEach(() => {
	mockEnv.AUTH_PASSWORD = 'secret';
	userRow = null;
});

describe('password hashing', () => {
	it('round-trips a correct password', async () => {
		const stored = await hashPassword('hunter2');
		expect(stored).toContain(':');
		expect(await verifyPassword('hunter2', stored)).toBe(true);
	});

	it('rejects an incorrect password', async () => {
		const stored = await hashPassword('hunter2');
		expect(await verifyPassword('wrong', stored)).toBe(false);
	});

	it('returns false for a malformed stored hash', async () => {
		expect(await verifyPassword('x', 'notvalid')).toBe(false);
		expect(await verifyPassword('x', '')).toBe(false);
	});

	it('produces a different salt each time', async () => {
		const a = await hashPassword('same');
		const b = await hashPassword('same');
		expect(a).not.toEqual(b);
	});
});

describe('session cookie', () => {
	it('resolves a valid cookie back to the user', async () => {
		const passwordHash = await hashPassword('pw');
		const row = { id: 'u1', email: 'b@e.com', username: 'bob', passwordHash, isAdmin: false, disabled: false, quotaBytes: null, usedBytes: 0, chatbotEnabled: true, apiToken: 't' };
		userRow = row;
		const cookie = sessionCookieValue(row);
		const resolved = await resolveSessionUser(cookie);
		expect(resolved?.id).toBe('u1');
		expect(resolved?.username).toBe('bob');
	});

	it('rejects a tampered signature', async () => {
		const passwordHash = await hashPassword('pw');
		const row = { id: 'u1', passwordHash, disabled: false };
		userRow = row;
		const cookie = sessionCookieValue(row as any);
		const tampered = cookie.slice(0, -1) + (cookie.endsWith('a') ? 'b' : 'a');
		expect(await resolveSessionUser(tampered)).toBeNull();
	});

	it('rejects when the user is disabled', async () => {
		const passwordHash = await hashPassword('pw');
		const row = { id: 'u1', passwordHash, disabled: true };
		userRow = row;
		const cookie = sessionCookieValue(row as any);
		expect(await resolveSessionUser(cookie)).toBeNull();
	});

	it('rejects a cookie with no dot separator', async () => {
		expect(await resolveSessionUser('nodot')).toBeNull();
		expect(await resolveSessionUser(undefined)).toBeNull();
	});

	it('is invalidated when AUTH_PASSWORD changes', async () => {
		const passwordHash = await hashPassword('pw');
		const row = { id: 'u1', passwordHash, disabled: false };
		userRow = row;
		const cookie = sessionCookieValue(row as any);
		mockEnv.AUTH_PASSWORD = 'different-server-secret';
		expect(await resolveSessionUser(cookie)).toBeNull();
	});
});

describe('api tokens', () => {
	it('generates a hex token', () => {
		const t = generateApiToken();
		expect(t).toMatch(/^[0-9a-f]{48}$/);
		expect(generateApiToken()).not.toEqual(t);
	});
});

describe('findUserByIdentifier', () => {
	it('returns the matched user row', async () => {
		userRow = { id: 'u1', username: 'bob' };
		expect(await findUserByIdentifier('bob')).toEqual(userRow);
		expect(await findUserByIdentifier('  bob@e.com ')).toEqual(userRow);
	});

	it('returns undefined for an empty identifier', async () => {
		expect(await findUserByIdentifier('   ')).toBeUndefined();
	});
});

describe('toSessionUser', () => {
	it('maps DB row fields to the session shape', () => {
		const row = { id: 'u1', email: 'b@e.com', username: 'bob', passwordHash: 'h', isAdmin: true, disabled: false, quotaBytes: 100, usedBytes: 5, chatbotEnabled: false, apiToken: 'tok' } as any;
		expect(toSessionUser(row)).toEqual({
			id: 'u1', email: 'b@e.com', username: 'bob', isAdmin: true, disabled: false,
			quotaBytes: 100, usedBytes: 5, chatbotEnabled: false, apiToken: 'tok'
		});
	});

	it('does not expose passwordHash', () => {
		const row = { id: 'u1', email: null, username: 'admin', passwordHash: 'secret', isAdmin: true, disabled: false, quotaBytes: null, usedBytes: 0, chatbotEnabled: true, apiToken: null } as any;
		expect((toSessionUser(row) as any).passwordHash).toBeUndefined();
	});
});

describe('findUserByEmail', () => {
	it('returns undefined for blank or whitespace-only email', async () => {
		expect(await findUserByEmail('')).toBeUndefined();
		expect(await findUserByEmail('   ')).toBeUndefined();
	});

	it('finds a user by email (db result is returned)', async () => {
		userRow = { id: 'u1', email: 'bob@example.com' };
		expect(await findUserByEmail('BOB@EXAMPLE.COM')).toEqual(userRow);
	});
});

describe('generateResetToken', () => {
	it('returns a 64-char hex token and matching 64-char sha256 hash', () => {
		const { token, hash } = generateResetToken();
		expect(token).toHaveLength(64);
		expect(hash).toHaveLength(64);
		expect(/^[0-9a-f]+$/.test(token)).toBe(true);
		expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
	});

	it('hash matches hashResetToken(token)', () => {
		const { token, hash } = generateResetToken();
		expect(hashResetToken(token)).toBe(hash);
	});

	it('expiry is approximately 1 hour in the future', () => {
		const before = Date.now();
		const { expiry } = generateResetToken();
		expect(expiry.getTime()).toBeGreaterThanOrEqual(before + 3_500_000);
		expect(expiry.getTime()).toBeLessThanOrEqual(before + 3_700_000);
	});

	it('generates unique tokens on each call', () => {
		expect(generateResetToken().token).not.toBe(generateResetToken().token);
	});
});

describe('hashResetToken', () => {
	it('produces the same hash for the same input', () => {
		expect(hashResetToken('abc')).toBe(hashResetToken('abc'));
	});

	it('produces different hashes for different inputs', () => {
		expect(hashResetToken('aaa')).not.toBe(hashResetToken('bbb'));
	});
});
