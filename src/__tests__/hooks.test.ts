import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must be declared before any imports that use $env
const mockEnv: Record<string, string | undefined> = { AUTH_PASSWORD: undefined, DEMO_MODE: undefined };

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => {
		throw { status, location };
	},
}));

const { handle } = await import('../hooks.server');

function makeEvent(path: string, options: { method?: string; authHeader?: string; cookie?: string } = {}) {
	const { method = 'GET', authHeader, cookie } = options;
	const headers = new Headers();
	if (authHeader) headers.set('authorization', authHeader);
	if (cookie) headers.set('cookie', `of_session=${cookie}`);

	return {
		url: new URL(`http://localhost${path}`),
		request: new Request(`http://localhost${path}`, { method, headers }),
		cookies: {
			get: (name: string) => (name === 'of_session' && cookie ? cookie : null),
		},
	} as any;
}

const resolve = vi.fn().mockResolvedValue(new Response('ok'));

describe('hooks — auth disabled', () => {
	beforeEach(() => {
		mockEnv.AUTH_PASSWORD = undefined;
		mockEnv.DEMO_MODE = undefined;
		resolve.mockClear();
	});

	it('passes all requests through when AUTH_PASSWORD is not set', async () => {
		const res = await handle({ event: makeEvent('/'), resolve });
		expect(resolve).toHaveBeenCalledOnce();
		expect(res.status).toBe(200);
	});
});

describe('hooks — auth enabled', () => {
	beforeEach(() => {
		mockEnv.AUTH_PASSWORD = 'secret';
		mockEnv.DEMO_MODE = undefined;
		resolve.mockClear();
	});

	it('redirects unauthenticated requests to /login', async () => {
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

	it('always allows /share/* through', async () => {
		await handle({ event: makeEvent('/share/lures/abc123'), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('always allows /uploads/* through', async () => {
		await handle({ event: makeEvent('/uploads/photo.jpg'), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('accepts a valid session cookie', async () => {
		// HMAC-SHA256 of 'openfishing-session' keyed with 'secret'
		const { createHmac } = await import('node:crypto');
		const token = createHmac('sha256', 'secret').update('openfishing-session').digest('hex');
		await handle({ event: makeEvent('/', { cookie: token }), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('rejects a wrong session cookie', async () => {
		await expect(
			handle({ event: makeEvent('/', { cookie: 'wrongtoken' }), resolve })
		).rejects.toMatchObject({ status: 303, location: '/login' });
	});

	it('accepts /api/v1/* with correct Bearer token', async () => {
		await handle({ event: makeEvent('/api/v1/lures', { authHeader: 'Bearer secret' }), resolve });
		expect(resolve).toHaveBeenCalledOnce();
	});

	it('rejects /api/v1/* with wrong Bearer token', async () => {
		const res = await handle({ event: makeEvent('/api/v1/lures', { authHeader: 'Bearer wrong' }), resolve });
		expect(res.status).toBe(401);
		expect(resolve).not.toHaveBeenCalled();
	});

	it('rejects /api/v1/* with missing Authorization header', async () => {
		const res = await handle({ event: makeEvent('/api/v1/lures'), resolve });
		expect(res.status).toBe(401);
	});
});

describe('hooks — demo mode', () => {
	beforeEach(() => {
		mockEnv.AUTH_PASSWORD = undefined;
		mockEnv.DEMO_MODE = '1';
		resolve.mockClear();
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
