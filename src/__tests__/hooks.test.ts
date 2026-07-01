import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must be declared before any imports that use $env
const mockEnv: Record<string, string | undefined> = { AUTH_PASSWORD: undefined, DEMO_MODE: undefined };

// Controlled by individual tests
let sessionUser: any = null;
let bearerUser: any = null;

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => {
		throw { status, location };
	},
}));
vi.mock('$lib/server/db', () => ({
	db: { query: { user: { findFirst: vi.fn(async () => bearerUser) } } },
}));
vi.mock('$lib/server/auth', () => ({
	SESSION_COOKIE_NAME: 'of_session',
	getAdminPassword: () => mockEnv.ADMIN_PASSWORD || mockEnv.AUTH_PASSWORD || undefined,
	ensureAdminUser: vi.fn().mockResolvedValue(undefined),
	resolveSessionUser: vi.fn(async () => sessionUser),
	toSessionUser: (row: any) => row,
}));

const { handle } = await import('../hooks.server');

function makeEvent(path: string, options: { method?: string; authHeader?: string; cookie?: string; accept?: string } = {}) {
	const { method = 'GET', authHeader, cookie, accept } = options;
	const headers = new Headers();
	if (authHeader) headers.set('authorization', authHeader);
	if (accept) headers.set('accept', accept);

	return {
		locals: {},
		url: new URL(`http://localhost${path}`),
		request: new Request(`http://localhost${path}`, { method, headers }),
		cookies: {
			get: (name: string) => (name === 'of_session' && cookie ? cookie : undefined),
			delete: vi.fn(),
		},
	} as any;
}

const resolve = vi.fn().mockResolvedValue(new Response('ok'));

beforeEach(() => {
	mockEnv.AUTH_PASSWORD = undefined;
	mockEnv.DEMO_MODE = undefined;
	sessionUser = null;
	bearerUser = null;
	resolve.mockClear();
});

describe('hooks — auth disabled (open mode)', () => {
	it('passes all requests through when AUTH_PASSWORD is not set', async () => {
		const event = makeEvent('/');
		const res = await handle({ event, resolve });
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(200);
		expect(event.locals.user).toBeNull();
	});
});

describe('hooks — auth enabled', () => {
	beforeEach(() => {
		mockEnv.AUTH_PASSWORD = 'secret';
	});

	it('redirects unauthenticated requests to /login', async () => {
		sessionUser = null;
		await expect(handle({ event: makeEvent('/'), resolve })).rejects.toMatchObject({
			status: 303,
			location: '/login',
		});
		expect(resolve).not.toHaveBeenCalled();
	});

	it('always allows /login through', async () => {
		await handle({ event: makeEvent('/login'), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('always allows /logout through', async () => {
		await handle({ event: makeEvent('/logout'), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('always allows /share/* through', async () => {
		await handle({ event: makeEvent('/share/lures/abc123'), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('always allows /uploads/* through', async () => {
		await handle({ event: makeEvent('/uploads/photo.jpg'), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('accepts a valid session cookie and sets locals.user', async () => {
		sessionUser = { id: 'u1', username: 'bob', isAdmin: false };
		const event = makeEvent('/', { cookie: 'good' });
		await handle({ event, resolve });
		expect(resolve).toHaveBeenCalledOnce();
		expect(event.locals.user).toEqual(sessionUser);
	});

	it('rejects an invalid session cookie', async () => {
		sessionUser = null;
		await expect(
			handle({ event: makeEvent('/', { cookie: 'wrongtoken' }), resolve })
		).rejects.toMatchObject({ status: 303, location: '/login' });
	});

	it('accepts /api/v1/* with a matching per-user Bearer token', async () => {
		bearerUser = { id: 'u1', username: 'bob', apiToken: 'tok', disabled: false };
		const event = makeEvent('/api/v1/lures', { authHeader: 'Bearer tok' });
		await handle({ event, resolve });
		expect(resolve).toHaveBeenCalledOnce();
		expect(event.locals.user).toEqual(bearerUser);
	});

	it('rejects /api/v1/* with an unknown Bearer token', async () => {
		bearerUser = null;
		const res = await handle({ event: makeEvent('/api/v1/lures', { authHeader: 'Bearer wrong' }), resolve });
		expect(res.status).toBe(401);
		expect(resolve).not.toHaveBeenCalled();
	});

	it('rejects /api/v1/* for a disabled user', async () => {
		bearerUser = { id: 'u1', apiToken: 'tok', disabled: true };
		const res = await handle({ event: makeEvent('/api/v1/lures', { authHeader: 'Bearer tok' }), resolve });
		expect(res.status).toBe(401);
	});

	it('rejects /api/v1/* with a missing Authorization header', async () => {
		const res = await handle({ event: makeEvent('/api/v1/lures'), resolve });
		expect(res.status).toBe(401);
	});

	it('allows /admin for an admin user', async () => {
		sessionUser = { id: 'a1', username: 'admin', isAdmin: true };
		await handle({ event: makeEvent('/settings/admin', { cookie: 'good' }), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('redirects /admin to / for a non-admin user', async () => {
		sessionUser = { id: 'u1', username: 'bob', isAdmin: false };
		await expect(
			handle({ event: makeEvent('/settings/admin', { cookie: 'good' }), resolve })
		).rejects.toMatchObject({ status: 303, location: '/' });
		expect(resolve).not.toHaveBeenCalled();
	});

	it('returns 403 JSON for /admin API requests by a non-admin', async () => {
		sessionUser = { id: 'u1', username: 'bob', isAdmin: false };
		const res = await handle({
			event: makeEvent('/settings/admin', { cookie: 'good', accept: 'application/json' }),
			resolve
		});
		expect(res.status).toBe(403);
	});
});

describe('hooks — demo mode', () => {
	beforeEach(() => {
		mockEnv.AUTH_PASSWORD = undefined;
		mockEnv.DEMO_MODE = '1';
	});

	it('allows GET requests through', async () => {
		await handle({ event: makeEvent('/'), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('blocks POST to API routes with 403', async () => {
		const res = await handle({ event: makeEvent('/api/v1/lures', { method: 'POST' }), resolve });
		expect(res.status).toBe(403);
		expect(resolve).not.toHaveBeenCalled();
	});

	it('allows POST to /api/lang (language toggle exempt from demo block)', async () => {
		await handle({ event: makeEvent('/api/lang', { method: 'POST' }), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('allows POST to /api/chat (chatbot exempt from demo block)', async () => {
		await handle({ event: makeEvent('/api/chat', { method: 'POST' }), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('redirects non-API POST (e.g. form submit) back to same path', async () => {
		await expect(
			handle({ event: makeEvent('/lures/new', { method: 'POST' }), resolve })
		).rejects.toMatchObject({ status: 303, location: '/lures/new' });
	});
});
