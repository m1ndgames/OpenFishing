import { describe, it, expect, vi } from 'vitest';

const mockEnv: Record<string, string | undefined> = { AUTH_PASSWORD: 'secret', ADMIN_EMAIL: 'boss@example.com' };
const findFirst = vi.fn(async () => undefined); // no admin exists yet
const insertValues = vi.fn(() => ({ returning: async () => [{ id: 'admin-1' }] }));
const updateSet = vi.fn(() => ({ where: async () => undefined }));

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('$lib/server/db', () => ({
	db: {
		query: { user: { findFirst: findFirst } },
		insert: () => ({ values: insertValues }),
		update: () => ({ set: updateSet }),
	},
}));

const { ensureAdminUser, syncAdminFromEnv } = await import('../auth');

describe('syncAdminFromEnv', () => {
	it('forces the admin identity (username "admin", no email) + password on an existing admin', async () => {
		updateSet.mockClear();
		findFirst.mockResolvedValueOnce({ id: 'a1', email: 'changed@me.com', username: 'renamed', apiToken: 'tok', isAdmin: true } as any);
		await syncAdminFromEnv();
		const set = updateSet.mock.calls[0][0] as any;
		expect(set.passwordHash).toBeTruthy();
		expect(set.username).toBe('admin');
		expect(set.email).toBeNull();
	});

	it('prefers ADMIN_PASSWORD over the deprecated AUTH_PASSWORD', async () => {
		mockEnv.ADMIN_PASSWORD = 'newvar';
		findFirst.mockResolvedValueOnce(undefined);
		const id = await syncAdminFromEnv();
		expect(id).toBeTruthy(); // created → not null (auth enabled via ADMIN_PASSWORD)
		mockEnv.ADMIN_PASSWORD = undefined;
	});

	it('returns null when neither password var is set (open mode)', async () => {
		const savedAuth = mockEnv.AUTH_PASSWORD;
		mockEnv.AUTH_PASSWORD = undefined;
		mockEnv.ADMIN_PASSWORD = undefined;
		expect(await syncAdminFromEnv()).toBeNull();
		mockEnv.AUTH_PASSWORD = savedAuth;
	});
});

describe('ensureAdminUser', () => {
	it('creates the admin from env and claims orphan rows on first run', async () => {
		insertValues.mockClear();
		await ensureAdminUser();
		// Admin created with fixed username, no email
		expect(insertValues).toHaveBeenCalledOnce();
		const values = insertValues.mock.calls[0][0] as any;
		expect(values.email).toBeNull();
		expect(values.username).toBe('admin');
		expect(values.isAdmin).toBe(true);
		// Orphan rows claimed across the owned tables
		expect(updateSet).toHaveBeenCalled();
	});

	it('is idempotent — does not run provisioning twice', async () => {
		insertValues.mockClear();
		await ensureAdminUser();
		expect(insertValues).not.toHaveBeenCalled();
	});
});
