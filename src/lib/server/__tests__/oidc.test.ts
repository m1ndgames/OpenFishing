import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEnv: Record<string, string | undefined> = {};
const findFirst = vi.fn();
const insertReturning = vi.fn();
const insertValues = vi.fn(() => ({ returning: insertReturning }));
const updateWhere = vi.fn(async () => undefined);
const updateSet = vi.fn(() => ({ where: updateWhere }));

vi.mock('#lib/server/env.js', () => ({ env: mockEnv }));
vi.mock('#lib/server/db/index.js', () => ({
	db: {
		query: { user: { findFirst } },
		insert: vi.fn(() => ({ values: insertValues })),
		update: vi.fn(() => ({ set: updateSet }))
	}
}));
vi.mock('openid-client', () => ({}));

const oidc = await import('../oidc');

beforeEach(() => {
	for (const k of Object.keys(mockEnv)) delete mockEnv[k];
	Object.assign(mockEnv, {
		ADMIN_PASSWORD: 'secret',
		OIDC_ISSUER: 'https://auth.example.com/',
		OIDC_CLIENT_ID: 'openfishing',
		OIDC_CLIENT_SECRET: 'shh',
		BASE_URL: 'https://fish.example.com'
	});
	findFirst.mockReset();
	insertReturning.mockReset();
	insertValues.mockClear();
	updateSet.mockClear();
	updateWhere.mockClear();
	insertReturning.mockImplementation(async () => [{ id: 'new', ...(insertValues.mock.calls.at(-1) as any)[0] }]);
});

describe('oidcEnabled', () => {
	it('is on when issuer, client id/secret and admin password are set', () => {
		expect(oidc.oidcEnabled()).toBe(true);
	});
	it('is off without ADMIN_PASSWORD (open mode has no session secret)', () => {
		delete mockEnv.ADMIN_PASSWORD;
		expect(oidc.oidcEnabled()).toBe(false);
	});
	it.each(['OIDC_ISSUER', 'OIDC_CLIENT_ID', 'OIDC_CLIENT_SECRET'])('is off without %s', (k) => {
		delete mockEnv[k];
		expect(oidc.oidcEnabled()).toBe(false);
	});
});

describe('helpers', () => {
	it('derives the provider label with a fallback', () => {
		expect(oidc.oidcProviderName()).toBe('SSO');
		mockEnv.OIDC_PROVIDER_NAME = ' Authelia ';
		expect(oidc.oidcProviderName()).toBe('Authelia');
	});
	it('strips trailing slashes from the issuer', () => {
		expect(oidc.oidcIssuer()).toBe('https://auth.example.com');
	});
	it('builds the redirect URI from BASE_URL', () => {
		expect(oidc.oidcRedirectUri()).toBe('https://fish.example.com/login/oidc/callback');
	});
	it('rebases the request URL onto BASE_URL, keeping path and query', () => {
		const out = oidc.rebaseOnBaseUrl(new URL('http://127.0.0.1:3000/login/oidc/callback?code=abc&state=xyz'));
		expect(out.toString()).toBe('https://fish.example.com/login/oidc/callback?code=abc&state=xyz');
	});
	it('round-trips the flow cookie and rejects junk', () => {
		const flow = { state: 's', nonce: 'n', verifier: 'v' };
		expect(oidc.decodeFlow(oidc.encodeFlow(flow))).toEqual(flow);
		expect(oidc.decodeFlow(undefined)).toBeNull();
		expect(oidc.decodeFlow('not-base64-json')).toBeNull();
		expect(oidc.decodeFlow(Buffer.from('{"state":1}').toString('base64url'))).toBeNull();
	});
});

describe('resolveOidcUser', () => {
	const claims = { sub: 'abc', email: 'Bob@Example.com', email_verified: true, preferred_username: 'bob' };

	it('returns the already-linked user', async () => {
		findFirst.mockResolvedValueOnce({ id: 'u1', disabled: false });
		expect((await oidc.resolveOidcUser(claims)).id).toBe('u1');
		expect(insertValues).not.toHaveBeenCalled();
	});

	it('refuses a linked but disabled user', async () => {
		findFirst.mockResolvedValueOnce({ id: 'u1', disabled: true });
		await expect(oidc.resolveOidcUser(claims)).rejects.toMatchObject({ code: 'disabled' });
	});

	it('links an unlinked local user by verified email', async () => {
		findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ id: 'u2', email: 'bob@example.com', disabled: false, isAdmin: false, oidcSubject: null });
		const u = await oidc.resolveOidcUser(claims);
		expect(u.id).toBe('u2');
		expect(updateSet).toHaveBeenCalledWith(expect.objectContaining({ oidcIssuer: 'https://auth.example.com', oidcSubject: 'abc' }));
		expect(insertValues).not.toHaveBeenCalled();
	});

	it('does NOT link by an unverified email — creates a separate account instead', async () => {
		findFirst
			.mockResolvedValueOnce(undefined) // linked
			.mockResolvedValueOnce({ id: 'victim' }) // emailTaken
			.mockResolvedValueOnce(undefined); // username free
		await oidc.resolveOidcUser({ ...claims, email_verified: false });
		expect(updateSet).not.toHaveBeenCalled();
		const row = (insertValues.mock.calls[0] as any)[0];
		expect(row.email).toBeNull(); // never duplicate the victim's email
		expect(row.oidcSubject).toBe('abc');
	});

	it('never links the admin account, even with a matching verified email', async () => {
		findFirst
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce({ id: 'admin', isAdmin: true, oidcSubject: null })
			.mockResolvedValueOnce({ id: 'admin' }) // emailTaken
			.mockResolvedValueOnce(undefined);
		await oidc.resolveOidcUser(claims);
		expect(updateSet).not.toHaveBeenCalled();
	});

	it('does not steal a local user already linked to another identity', async () => {
		findFirst
			.mockResolvedValueOnce(undefined)
			.mockResolvedValueOnce({ id: 'u3', isAdmin: false, oidcSubject: 'someone-else' })
			.mockResolvedValueOnce({ id: 'u3' })
			.mockResolvedValueOnce(undefined);
		await oidc.resolveOidcUser(claims);
		expect(updateSet).not.toHaveBeenCalled();
	});

	it('auto-creates a regular, unusable-password user with a de-duplicated username', async () => {
		findFirst
			.mockResolvedValueOnce(undefined) // linked
			.mockResolvedValueOnce(undefined) // by email
			.mockResolvedValueOnce(undefined) // emailTaken
			.mockResolvedValueOnce({ id: 'x' }) // "bob" taken
			.mockResolvedValueOnce(undefined); // "bob2" free
		await oidc.resolveOidcUser(claims);
		const row = (insertValues.mock.calls[0] as any)[0];
		expect(row).toMatchObject({
			username: 'bob2',
			email: 'bob@example.com',
			isAdmin: false,
			quotaBytes: null,
			oidcIssuer: 'https://auth.example.com',
			oidcSubject: 'abc'
		});
		expect(row.passwordHash.startsWith('oidc!')).toBe(true);
		expect(row.passwordHash).not.toContain(':');
		expect(row.apiToken).toBeTruthy();
	});

	it('sanitises odd usernames and falls back to the email local part', async () => {
		findFirst.mockResolvedValue(undefined);
		await oidc.resolveOidcUser({ sub: 's', email: 'jo.smith@example.com', preferred_username: '  ' });
		expect((insertValues.mock.calls[0] as any)[0].username).toBe('jo.smith');
		await oidc.resolveOidcUser({ sub: 't', preferred_username: 'a b/c<d>' });
		expect((insertValues.mock.calls[1] as any)[0].username).toBe('a_b_c_d');
	});

	it('refuses unknown identities when OIDC_AUTO_CREATE=false', async () => {
		mockEnv.OIDC_AUTO_CREATE = 'false';
		findFirst.mockResolvedValue(undefined);
		await expect(oidc.resolveOidcUser(claims)).rejects.toMatchObject({ code: 'no_account' });
		expect(insertValues).not.toHaveBeenCalled();
	});

	it('still links a pre-created local user when OIDC_AUTO_CREATE=false', async () => {
		mockEnv.OIDC_AUTO_CREATE = 'false';
		findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ id: 'u2', disabled: false, isAdmin: false, oidcSubject: null });
		expect((await oidc.resolveOidcUser(claims)).id).toBe('u2');
	});

	it('refuses to link a disabled local user', async () => {
		findFirst.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ id: 'u2', disabled: true, isAdmin: false, oidcSubject: null });
		await expect(oidc.resolveOidcUser(claims)).rejects.toMatchObject({ code: 'disabled' });
	});
});
