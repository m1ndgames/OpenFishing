import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockUserFindFirst = vi.fn();
const mockUpdateSet = vi.fn();
const cookieDelete = vi.fn();
let verifyResult = true;

vi.mock('@sveltejs/kit', () => ({
	fail: (status: number, data: any) => ({ status, data }),
	redirect: (status: number, location: string) => { throw { status, location }; },
}));
vi.mock('$lib/server/auth', () => ({
	hashPassword: vi.fn(async () => 'hashed'),
	verifyPassword: vi.fn(async () => verifyResult),
	generateApiToken: vi.fn(() => 'newtoken'),
	SESSION_COOKIE_NAME: 'of_session',
}));
vi.mock('$lib/server/db', () => ({
	db: {
		query: { user: { findFirst: mockUserFindFirst } },
		update: () => ({ set: (v: any) => { mockUpdateSet(v); return { where: async () => undefined }; } }),
	},
}));

const { actions } = await import('../account/+page.server');

function ev(entries: Record<string, string>, user: any = { id: 'u1', isAdmin: false }) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(entries)) fd.append(k, v);
	return { request: { formData: async () => fd }, locals: { user }, cookies: { delete: cookieDelete } } as any;
}

beforeEach(() => {
	mockUserFindFirst.mockReset();
	mockUpdateSet.mockClear();
	cookieDelete.mockClear();
	verifyResult = true;
});

describe('account updateProfile', () => {
	it('blocks the admin account', async () => {
		const res: any = await actions.updateProfile(ev({ email: 'a@b.com', username: 'bob' }, { id: 'a1', isAdmin: true }));
		expect(res).toMatchObject({ status: 403, data: { error: 'adminEnvControlled' } });
	});

	it('rejects a duplicate email/username', async () => {
		mockUserFindFirst.mockResolvedValue({ id: 'other' });
		const res: any = await actions.updateProfile(ev({ email: 'a@b.com', username: 'bob' }));
		expect(res).toMatchObject({ status: 409, data: { error: 'userExists' } });
	});

	it('updates the profile', async () => {
		mockUserFindFirst.mockResolvedValue(undefined);
		const res: any = await actions.updateProfile(ev({ email: 'a@b.com', username: 'bob' }));
		expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com', username: 'bob' }));
		expect(res).toMatchObject({ success: 'profileUpdated' });
	});
});

describe('account changePassword', () => {
	it('rejects a wrong current password', async () => {
		verifyResult = false;
		mockUserFindFirst.mockResolvedValue({ id: 'u1', passwordHash: 'h' });
		const res: any = await actions.changePassword(ev({ current_password: 'x', new_password: 'y' }));
		expect(res).toMatchObject({ status: 401, data: { error: 'wrongPassword' } });
	});

	it('changes the password, clears the cookie and redirects to /login', async () => {
		verifyResult = true;
		mockUserFindFirst.mockResolvedValue({ id: 'u1', passwordHash: 'h' });
		await expect(actions.changePassword(ev({ current_password: 'old', new_password: 'new' })))
			.rejects.toMatchObject({ status: 303, location: '/login' });
		expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'hashed' }));
		expect(cookieDelete).toHaveBeenCalledWith('of_session', { path: '/' });
	});
});

describe('account regenerateToken', () => {
	it('sets a new API token', async () => {
		const res: any = await actions.regenerateToken(ev({}));
		expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ apiToken: 'newtoken' }));
		expect(res).toMatchObject({ success: 'tokenRegenerated' });
	});
});
