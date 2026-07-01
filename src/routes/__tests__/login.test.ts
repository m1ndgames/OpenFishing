import { describe, it, expect, vi, beforeEach } from 'vitest';

let authOn = true;
let mailOn = false;
const mockEnsureAdminUser = vi.fn(async () => undefined);
const mockResolveSession = vi.fn(async () => null as any);
const mockFindUser = vi.fn(async () => undefined as any);
const mockVerifyPassword = vi.fn(async () => false);
const mockCookiesSet = vi.fn();

vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => { throw { status, location }; },
	fail: (status: number, data: any) => ({ status, data }),
}));
vi.mock('$lib/server/auth', () => ({
	SESSION_COOKIE_NAME: 'of_session',
	authEnabled: () => authOn,
	ensureAdminUser: mockEnsureAdminUser,
	findUserByIdentifier: mockFindUser,
	resolveSessionUser: mockResolveSession,
	sessionCookieValue: vi.fn(() => 'u1.sig'),
	verifyPassword: mockVerifyPassword,
}));
vi.mock('$lib/server/mail', () => ({
	mailConfigured: () => mailOn,
}));

const { load, actions } = await import('../login/+page.server');

function cookies(val?: string) {
	return { get: (_: string) => val, set: mockCookiesSet } as any;
}

function form(entries: Record<string, string> = {}) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(entries)) fd.append(k, v);
	return { formData: async () => fd } as any;
}

beforeEach(() => {
	authOn = true;
	mailOn = false;
	mockEnsureAdminUser.mockClear();
	mockResolveSession.mockReset().mockResolvedValue(null);
	mockFindUser.mockReset().mockResolvedValue(undefined);
	mockVerifyPassword.mockReset().mockResolvedValue(false);
	mockCookiesSet.mockClear();
});

describe('login load', () => {
	it('redirects to / when auth is disabled', async () => {
		authOn = false;
		await expect(load({ cookies: cookies() } as any)).rejects.toMatchObject({ status: 303, location: '/' });
	});

	it('redirects to / when already logged in', async () => {
		mockResolveSession.mockResolvedValue({ id: 'u1' });
		await expect(load({ cookies: cookies('u1.sig') } as any)).rejects.toMatchObject({ status: 303, location: '/' });
	});

	it('returns mailEnabled: false when SMTP is not configured', async () => {
		const result = await load({ cookies: cookies() } as any);
		expect(result).toMatchObject({ mailEnabled: false });
	});

	it('returns mailEnabled: true when SMTP is configured', async () => {
		mailOn = true;
		const result = await load({ cookies: cookies() } as any);
		expect(result).toMatchObject({ mailEnabled: true });
	});

	it('calls ensureAdminUser on each load', async () => {
		await load({ cookies: cookies() } as any);
		expect(mockEnsureAdminUser).toHaveBeenCalled();
	});
});

describe('login action', () => {
	it('redirects to / when auth is disabled', async () => {
		authOn = false;
		await expect(
			actions.default({ request: form(), cookies: cookies() } as any)
		).rejects.toMatchObject({ status: 303, location: '/' });
	});

	it('fails with 401 when user is not found', async () => {
		mockFindUser.mockResolvedValue(undefined);
		const result = await actions.default({ request: form({ identifier: 'nobody', password: 'pw' }), cookies: cookies() } as any);
		expect(result).toMatchObject({ status: 401 });
	});

	it('fails with 401 when user account is disabled', async () => {
		mockFindUser.mockResolvedValue({ id: 'u1', disabled: true, passwordHash: 'h' });
		const result = await actions.default({ request: form({ identifier: 'bob', password: 'pw' }), cookies: cookies() } as any);
		expect(result).toMatchObject({ status: 401 });
	});

	it('fails with 401 when password is wrong', async () => {
		mockFindUser.mockResolvedValue({ id: 'u1', disabled: false, passwordHash: 'h' });
		mockVerifyPassword.mockResolvedValue(false);
		const result = await actions.default({ request: form({ identifier: 'bob', password: 'wrong' }), cookies: cookies() } as any);
		expect(result).toMatchObject({ status: 401 });
	});

	it('sets the session cookie and redirects to / on success', async () => {
		mockFindUser.mockResolvedValue({ id: 'u1', disabled: false, passwordHash: 'h' });
		mockVerifyPassword.mockResolvedValue(true);
		await expect(
			actions.default({ request: form({ identifier: 'bob', password: 'correct' }), cookies: cookies() } as any)
		).rejects.toMatchObject({ status: 303, location: '/' });
		expect(mockCookiesSet).toHaveBeenCalledWith('of_session', 'u1.sig', expect.any(Object));
	});
});
