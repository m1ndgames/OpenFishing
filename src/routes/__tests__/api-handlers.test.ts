import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => { throw { status, location }; },
	json: (data: any, init?: any) => new Response(JSON.stringify(data), { status: init?.status ?? 200, headers: { 'Content-Type': 'application/json' } }),
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
}));

const mockFindFirst = vi.fn();
const mockUpdate = vi.fn();

function makeChain(result: any = undefined) {
	const self: any = {};
	['set', 'from', 'orderBy'].forEach(k => { self[k] = vi.fn(() => self); });
	self.where = vi.fn(() => Promise.resolve(result ?? []));
	self.then = (fn: any, rej: any) => Promise.resolve(result).then(fn, rej);
	return self;
}

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			lure: { findFirst: mockFindFirst },
		},
		update: mockUpdate,
	},
}));

const { POST: langPost } = await import('../api/lang/+server');
const { POST: favouritePost } = await import('../api/lures/[id]/favourite/+server');

function makeRequest(entries: Record<string, string> = {}, method = 'POST'): Request {
	const fd = new FormData();
	for (const [k, v] of Object.entries(entries)) fd.append(k, v);
	return { method, formData: () => Promise.resolve(fd) } as any;
}

describe('POST /api/lang', () => {
	it('sets lang cookie for a supported language and redirects', async () => {
		const cookies = { set: vi.fn() };
		const request = makeRequest({ lang: 'de', redirect: '/lures' });
		await expect(
			langPost({ request, cookies } as any)
		).rejects.toMatchObject({ status: 303, location: '/lures' });
		expect(cookies.set).toHaveBeenCalledWith('lang', 'de', expect.any(Object));
	});

	it('does not set cookie for unsupported language', async () => {
		const cookies = { set: vi.fn() };
		const request = makeRequest({ lang: 'klingon', redirect: '/' });
		await expect(
			langPost({ request, cookies } as any)
		).rejects.toMatchObject({ status: 303 });
		expect(cookies.set).not.toHaveBeenCalled();
	});

	it('redirects to / by default when redirect field is absent', async () => {
		const cookies = { set: vi.fn() };
		const request = makeRequest({ lang: 'fr' });
		await expect(
			langPost({ request, cookies } as any)
		).rejects.toMatchObject({ status: 303, location: '/' });
	});

	it('sets cookie for all supported languages', async () => {
		const supported = ['en', 'de', 'fr', 'es', 'it', 'nl', 'pl', 'pt', 'uk'];
		for (const lang of supported) {
			const cookies = { set: vi.fn() };
			const request = makeRequest({ lang });
			await expect(langPost({ request, cookies } as any)).rejects.toMatchObject({ status: 303 });
			expect(cookies.set).toHaveBeenCalledWith('lang', lang, expect.any(Object));
		}
	});
});

describe('POST /api/lures/[id]/favourite', () => {
	beforeEach(() => {
		mockUpdate.mockImplementation(() => makeChain());
	});

	it('toggles favourite from false to true', async () => {
		mockFindFirst.mockResolvedValue({ id: 'lure-001', favourite: false });
		const res = await favouritePost({ params: { id: 'lure-001' } } as any);
		const body = await res.json();
		expect(body.favourite).toBe(true);
		expect(mockUpdate).toHaveBeenCalled();
	});

	it('toggles favourite from true to false', async () => {
		mockFindFirst.mockResolvedValue({ id: 'lure-001', favourite: true });
		const res = await favouritePost({ params: { id: 'lure-001' } } as any);
		const body = await res.json();
		expect(body.favourite).toBe(false);
	});

	it('throws 404 when lure is not found', async () => {
		mockFindFirst.mockResolvedValue(undefined);
		await expect(
			favouritePost({ params: { id: 'x' } } as any)
		).rejects.toMatchObject({ status: 404 });
	});
});

const mockEnv = await import('../../__mocks__/env');

describe('login page server', () => {
	beforeEach(() => {
		mockEnv.env.AUTH_PASSWORD = undefined;
	});

	it('redirects to / from load when auth is disabled', async () => {
		// Dynamic import after env is set
		const mod = await import('../login/+page.server');
		const cookies = { get: vi.fn().mockReturnValue(null) };
		await expect(mod.load({ cookies } as any)).rejects.toMatchObject({ status: 303, location: '/' });
	});

	it('login action: redirects to / when auth is disabled', async () => {
		const mod = await import('../login/+page.server');
		await expect(
			mod.actions.default({ request: makeRequest({ password: 'x' }), cookies: { set: vi.fn() } } as any)
		).rejects.toMatchObject({ status: 303, location: '/' });
	});
});
