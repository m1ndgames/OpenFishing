import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEnv: Record<string, string | undefined> = { BASE_URL: 'https://fish.example.com' };
const findUserByEmail = vi.fn();
const sendMail = vi.fn(async () => undefined);
const updateSet = vi.fn(() => ({ where: async () => undefined }));
const userFindFirst = vi.fn();
let mailOn = true;
let authOn = true;

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('@sveltejs/kit', () => ({
	fail: (status: number, data: any) => ({ status, data }),
	redirect: (status: number, location: string) => { throw { status, location }; },
}));
vi.mock('$lib/server/db', () => ({
	db: {
		query: { user: { findFirst: userFindFirst } },
		update: () => ({ set: updateSet }),
	},
}));
vi.mock('$lib/server/auth', () => ({
	authEnabled: () => authOn,
	findUserByEmail,
	generateResetToken: () => ({ token: 'raw-token', hash: 'hashed-token', expiry: new Date(Date.now() + 3600_000) }),
	hashResetToken: (t: string) => `hashed:${t}`,
	hashPassword: async (p: string) => `scrypt:${p}`,
}));
vi.mock('$lib/server/mail', () => ({
	mailConfigured: () => mailOn,
	sendPasswordResetEmail: sendMail,
}));

const forgot = await import('../forgot-password/+page.server');
const reset = await import('../reset-password/+page.server');

function form(entries: Record<string, string>) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(entries)) fd.append(k, v);
	return { request: { formData: async () => fd }, cookies: { get: () => 'en' }, url: new URL('https://fish.example.com/forgot-password') } as any;
}

beforeEach(() => {
	mailOn = true; authOn = true;
	findUserByEmail.mockReset();
	sendMail.mockClear();
	updateSet.mockClear();
	userFindFirst.mockReset();
});

describe('forgot-password action', () => {
	it('sends a reset email + stores a token when the email matches a user', async () => {
		findUserByEmail.mockResolvedValue({ id: 'u1', email: 'bob@example.com', disabled: false });
		const res: any = await forgot.actions.default(form({ email: 'bob@example.com' }));
		expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ resetTokenHash: 'hashed-token' }));
		expect(sendMail).toHaveBeenCalledOnce();
		const [to, url] = sendMail.mock.calls[0];
		expect(to).toBe('bob@example.com');
		expect(url).toBe('https://fish.example.com/reset-password?token=raw-token');
		expect(res).toMatchObject({ sent: true });
	});

	it('returns the same generic response when the email does NOT match (no enumeration)', async () => {
		findUserByEmail.mockResolvedValue(undefined);
		const res: any = await forgot.actions.default(form({ email: 'nobody@example.com' }));
		expect(sendMail).not.toHaveBeenCalled();
		expect(updateSet).not.toHaveBeenCalled();
		expect(res).toMatchObject({ sent: true });
	});

	it('does not email a user that has no email (e.g. admin)', async () => {
		findUserByEmail.mockResolvedValue({ id: 'a1', email: null, disabled: false });
		const res: any = await forgot.actions.default(form({ email: 'x@y.com' }));
		expect(sendMail).not.toHaveBeenCalled();
		expect(res).toMatchObject({ sent: true });
	});

	it('redirects to /login when mail is not configured', async () => {
		mailOn = false;
		await expect(forgot.actions.default(form({ email: 'bob@example.com' })))
			.rejects.toMatchObject({ status: 303, location: '/login' });
	});
});

describe('reset-password action', () => {
	it('rejects an invalid/expired token', async () => {
		userFindFirst.mockResolvedValue(undefined);
		const res: any = await reset.actions.default(form({ token: 'bad', password: 'newpw' }));
		expect(res).toMatchObject({ status: 400, data: { error: 'resetTokenInvalid' } });
	});

	it('requires a new password', async () => {
		const res: any = await reset.actions.default(form({ token: 'x', password: '' }));
		expect(res).toMatchObject({ status: 400, data: { error: 'passwordRequired' } });
	});

	it('sets the new password, clears the token, and redirects to /login', async () => {
		userFindFirst.mockResolvedValue({ id: 'u1' });
		await expect(reset.actions.default(form({ token: 'good', password: 'newpw' })))
			.rejects.toMatchObject({ status: 303, location: '/login?reset=1' });
		expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'scrypt:newpw', resetTokenHash: null, resetTokenExpiry: null }));
	});

	it('load reports validity from the token', async () => {
		userFindFirst.mockResolvedValue({ id: 'u1' });
		const okRes: any = await reset.load({ url: new URL('https://x/reset-password?token=good') } as any);
		expect(okRes).toMatchObject({ valid: true, token: 'good' });
		userFindFirst.mockResolvedValue(undefined);
		const badRes: any = await reset.load({ url: new URL('https://x/reset-password?token=bad') } as any);
		expect(badRes).toMatchObject({ valid: false });
	});
});
