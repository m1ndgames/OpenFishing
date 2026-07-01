import { describe, it, expect, vi } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => { throw { status, location }; },
}));
vi.mock('$lib/server/auth', () => ({ SESSION_COOKIE_NAME: 'of_session' }));

const { load, actions } = await import('../logout/+page.server');

describe('logout load', () => {
	it('redirects to /', async () => {
		await expect(load({} as any)).rejects.toMatchObject({ status: 303, location: '/' });
	});
});

describe('logout action', () => {
	it('deletes the session cookie and redirects to /login', async () => {
		const cookieDelete = vi.fn();
		await expect(
			actions.default({ cookies: { delete: cookieDelete } } as any)
		).rejects.toMatchObject({ status: 303, location: '/login' });
		expect(cookieDelete).toHaveBeenCalledWith('of_session', { path: '/' });
	});
});
