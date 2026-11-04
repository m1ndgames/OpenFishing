import { describe, it, expect, vi, beforeEach } from 'vitest';

let enabled = true;
const mockBegin = vi.fn();
const mockComplete = vi.fn();
const mockResolve = vi.fn();

class OidcLoginError extends Error {
	constructor(public code: string) {
		super(code);
	}
}

vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => { throw { status, location }; },
}));
vi.mock('#lib/server/auth.js', () => ({
	SESSION_COOKIE_NAME: 'of_session',
	sessionCookieValue: vi.fn(() => 'u1.sig'),
}));
vi.mock('#lib/server/oidc.js', () => ({
	OIDC_FLOW_COOKIE: 'of_oidc',
	OIDC_FLOW_MAX_AGE: 600,
	OidcLoginError,
	oidcEnabled: () => enabled,
	beginOidcLogin: mockBegin,
	encodeFlow: (f: any) => JSON.stringify(f),
	decodeFlow: (raw: string | undefined) => (raw ? JSON.parse(raw) : null),
	completeOidcLogin: mockComplete,
	resolveOidcUser: mockResolve,
	rebaseOnBaseUrl: (u: URL) => new URL(u.pathname + u.search, 'https://fish.example.com'),
}));

const start = await import('../login/oidc/+server');
const callback = await import('../login/oidc/callback/+server');

const flow = { state: 's', nonce: 'n', verifier: 'v' };
const store: Record<string, string> = {};
const cookies = {
	get: (k: string) => store[k],
	set: vi.fn((k: string, v: string) => { store[k] = v; }),
	delete: vi.fn((k: string) => { delete store[k]; }),
};

beforeEach(() => {
	enabled = true;
	for (const k of Object.keys(store)) delete store[k];
	cookies.set.mockClear();
	cookies.delete.mockClear();
	mockBegin.mockReset().mockResolvedValue({ url: new URL('https://auth.example.com/authorize?x=1'), flow });
	mockComplete.mockReset().mockResolvedValue({ sub: 'abc' });
	mockResolve.mockReset().mockResolvedValue({ id: 'u1', passwordHash: 'h' });
});

describe('GET /login/oidc', () => {
	it('redirects to /login when OIDC is off', async () => {
		enabled = false;
		await expect(start.GET({ cookies } as any)).rejects.toMatchObject({ status: 303, location: '/login' });
	});

	it('sets a Lax httpOnly flow cookie and redirects to the provider', async () => {
		const res = (await start.GET({ cookies } as any)) as Response;
		expect(res.status).toBe(302);
		expect(res.headers.get('location')).toBe('https://auth.example.com/authorize?x=1');
		expect(cookies.set).toHaveBeenCalledWith('of_oidc', JSON.stringify(flow), expect.objectContaining({ httpOnly: true, sameSite: 'lax', maxAge: 600 }));
	});

	it('falls back to /login with an error when discovery fails', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		mockBegin.mockRejectedValue(new Error('ECONNREFUSED'));
		await expect(start.GET({ cookies } as any)).rejects.toMatchObject({ status: 303, location: '/login?oidc_error=failed' });
		expect(cookies.set).not.toHaveBeenCalled();
	});
});

describe('GET /login/oidc/callback', () => {
	const call = (qs = '?code=c&state=s') => callback.GET({ url: new URL('http://127.0.0.1:3000/login/oidc/callback' + qs), cookies } as any);

	it('redirects to /login when OIDC is off', async () => {
		enabled = false;
		await expect(call()).rejects.toMatchObject({ location: '/login' });
	});

	it('rejects a callback with no flow cookie (and does not call the provider)', async () => {
		await expect(call()).rejects.toMatchObject({ location: '/login?oidc_error=failed' });
		expect(mockComplete).not.toHaveBeenCalled();
	});

	it('maps a provider error to "denied"', async () => {
		store.of_oidc = JSON.stringify(flow);
		await expect(call('?error=access_denied')).rejects.toMatchObject({ location: '/login?oidc_error=denied' });
		expect(cookies.delete).toHaveBeenCalledWith('of_oidc', { path: '/login/oidc' });
	});

	it('always clears the flow cookie (single use)', async () => {
		store.of_oidc = JSON.stringify(flow);
		await call();
		expect(cookies.delete).toHaveBeenCalledWith('of_oidc', { path: '/login/oidc' });
	});

	it('hands the library the BASE_URL-rebased callback URL and the stored flow', async () => {
		store.of_oidc = JSON.stringify(flow);
		await call();
		expect(mockComplete).toHaveBeenCalledWith(new URL('https://fish.example.com/login/oidc/callback?code=c&state=s'), flow);
	});

	it('logs in: sets a Strict session cookie and answers with an interstitial, not a redirect', async () => {
		store.of_oidc = JSON.stringify(flow);
		const res = (await call()) as Response;
		expect(cookies.set).toHaveBeenCalledWith('of_session', 'u1.sig', expect.objectContaining({ httpOnly: true, sameSite: 'strict' }));
		expect(res.status).toBe(200);
		expect(await res.text()).toContain('url=/');
	});

	it.each(['no_account', 'disabled'])('surfaces the %s refusal without a session', async (code) => {
		store.of_oidc = JSON.stringify(flow);
		mockResolve.mockRejectedValue(new OidcLoginError(code));
		await expect(call()).rejects.toMatchObject({ location: `/login?oidc_error=${code}` });
		expect(cookies.set).not.toHaveBeenCalledWith('of_session', expect.anything(), expect.anything());
	});

	it('treats a token-validation failure (bad state/nonce/signature) as "failed"', async () => {
		vi.spyOn(console, 'error').mockImplementation(() => undefined);
		store.of_oidc = JSON.stringify(flow);
		mockComplete.mockRejectedValue(new Error('unexpected JWT "nonce" claim value'));
		await expect(call()).rejects.toMatchObject({ location: '/login?oidc_error=failed' });
		expect(mockResolve).not.toHaveBeenCalled();
	});
});
