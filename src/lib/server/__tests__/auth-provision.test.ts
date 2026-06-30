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

const { ensureAdminUser } = await import('../auth');

describe('ensureAdminUser', () => {
	it('creates the admin from env and claims orphan rows on first run', async () => {
		await ensureAdminUser();
		// Admin created with env email
		expect(insertValues).toHaveBeenCalledOnce();
		const values = insertValues.mock.calls[0][0] as any;
		expect(values.email).toBe('boss@example.com');
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
