import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	json: (data: any) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }),
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
}));

const mockLureFindMany = vi.fn();
const mockCatchFindMany = vi.fn();
const mockSpotFindMany = vi.fn();
const mockRodFindMany = vi.fn();
const mockReelFindMany = vi.fn();
const mockLineFindMany = vi.fn();
const mockComboFindMany = vi.fn();
const mockLureFindFirst = vi.fn();
const mockCatchFindFirst = vi.fn();
const mockSpotFindFirst = vi.fn();
const mockReelLogFindFirst = vi.fn();
const mockSelect = vi.fn();

function makeChain(result: any = []) {
	const self: any = {
		from: vi.fn(() => self),
		where: vi.fn(() => Promise.resolve(result)),
		orderBy: vi.fn(() => self),
		leftJoin: vi.fn(() => self),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
		catch: (fn: any) => Promise.resolve(result).catch(fn),
	};
	return self;
}

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			lure: { findMany: mockLureFindMany, findFirst: mockLureFindFirst },
			fishCatch: { findMany: mockCatchFindMany, findFirst: mockCatchFindFirst },
			spot: { findMany: mockSpotFindMany, findFirst: mockSpotFindFirst },
			rod: { findMany: mockRodFindMany },
			reel: { findMany: mockReelFindMany },
			fishingLine: { findMany: mockLineFindMany },
			combo: { findMany: mockComboFindMany },
			reelLineLog: { findFirst: mockReelLogFindFirst },
		},
		select: mockSelect,
	},
}));

const { GET: getLures } = await import('../api/v1/lures/+server');
const { GET: getCatches } = await import('../api/v1/catches/+server');
const { GET: getSpots } = await import('../api/v1/spots/+server');
const { load: shareLoad } = await import('../share/lures/[token]/+page.server');
const { load: shareCatchLoad } = await import('../share/catches/[token]/+page.server');
const { load: shareSpotLoad } = await import('../share/spots/[token]/+page.server');
const { load: layoutLoad } = await import('../+layout.server');

describe('GET /api/v1/lures', () => {
	beforeEach(() => {
		mockLureFindMany.mockResolvedValue([]);
	});

	it('returns empty array when no lures', async () => {
		const res = await getLures({} as any);
		expect(await res.json()).toEqual([]);
	});

	it('strips photoPath and flattens tags to strings', async () => {
		mockLureFindMany.mockResolvedValue([{
			id: 'l1', name: 'Spinner', photoPath: '/uploads/x.jpg',
			tags: [{ id: 't1', name: 'river' }]
		}]);
		const res = await getLures({} as any);
		const data = await res.json();
		expect(data[0].photoPath).toBeUndefined();
		expect(data[0].tags).toEqual(['river']);
		expect(data[0].name).toBe('Spinner');
	});
});

describe('GET /api/v1/catches', () => {
	beforeEach(() => {
		mockCatchFindMany.mockResolvedValue([]);
	});

	it('returns empty array when no catches', async () => {
		const res = await getCatches({} as any);
		expect(await res.json()).toEqual([]);
	});

	it('returns lure as { id, name } summary', async () => {
		mockCatchFindMany.mockResolvedValue([{
			id: 'c1', species: 'Pike',
			lure: { id: 'l1', name: 'Spinner', photoPath: 'x.jpg', brand: 'Mepps' }
		}]);
		const res = await getCatches({} as any);
		const data = await res.json();
		expect(data[0].lure).toEqual({ id: 'l1', name: 'Spinner' });
		expect(data[0].lure.photoPath).toBeUndefined();
	});

	it('returns lure=null when catch has no lure', async () => {
		mockCatchFindMany.mockResolvedValue([{ id: 'c1', species: 'Pike', lure: null }]);
		const res = await getCatches({} as any);
		const data = await res.json();
		expect(data[0].lure).toBeNull();
	});
});

describe('GET /api/v1/spots', () => {
	beforeEach(() => {
		mockSpotFindMany.mockResolvedValue([]);
	});

	it('returns empty array when no spots', async () => {
		const res = await getSpots({} as any);
		expect(await res.json()).toEqual([]);
	});

	it('flattens tags to strings', async () => {
		mockSpotFindMany.mockResolvedValue([{
			id: 's1', name: 'Lake', tags: [{ id: 't1', name: 'carp' }]
		}]);
		const res = await getSpots({} as any);
		const data = await res.json();
		expect(data[0].tags).toEqual(['carp']);
	});
});

describe('share/lures/[token] load', () => {
	it('returns lure when token matches', async () => {
		mockLureFindFirst.mockResolvedValue({ id: 'l1', name: 'Spinner', shareToken: 'tok', tags: [] });
		const result = await shareLoad({ params: { token: 'tok' } } as any);
		expect(result.lure.name).toBe('Spinner');
	});

	it('throws 404 when token does not match', async () => {
		mockLureFindFirst.mockResolvedValue(undefined);
		await expect(shareLoad({ params: { token: 'bad' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('share/catches/[token] load', () => {
	it('returns catch when token matches', async () => {
		mockCatchFindFirst.mockResolvedValue({
			id: 'c1', species: 'Pike', shareToken: 'tok', photos: [], lure: null,
		});
		const result = await shareCatchLoad({ params: { token: 'tok' } } as any);
		expect(result.catch.species).toBe('Pike');
	});

	it('throws 404 when token does not match', async () => {
		mockCatchFindFirst.mockResolvedValue(undefined);
		await expect(shareCatchLoad({ params: { token: 'bad' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('share/spots/[token] load', () => {
	it('returns spot when token matches', async () => {
		mockSpotFindFirst.mockResolvedValue({
			id: 's1', name: 'Lake', shareToken: 'tok', tags: [], photos: [],
		});
		const result = await shareSpotLoad({ params: { token: 'tok' } } as any);
		expect(result.spot.name).toBe('Lake');
	});

	it('throws 404 when token does not match', async () => {
		mockSpotFindFirst.mockResolvedValue(undefined);
		await expect(shareSpotLoad({ params: { token: 'bad' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

const mockEnv = await import('../../__mocks__/env');

describe('layout server load', () => {
	beforeEach(() => {
		mockEnv.env.DEMO_MODE = undefined;
		mockEnv.env.CHATBOT = undefined;
	});

	it('defaults to English when no lang cookie', async () => {
		const result = await layoutLoad({
			cookies: { get: vi.fn().mockReturnValue(null) },
			request: { headers: { get: vi.fn().mockReturnValue('') } },
		} as any);
		expect(result.lang).toBe('en');
	});

	it('uses lang cookie when it is a supported language', async () => {
		const result = await layoutLoad({
			cookies: { get: vi.fn().mockReturnValue('de') },
			request: { headers: { get: vi.fn().mockReturnValue('en') } },
		} as any);
		expect(result.lang).toBe('de');
	});

	it('falls back to browser Accept-Language header', async () => {
		const result = await layoutLoad({
			cookies: { get: vi.fn().mockReturnValue('') },
			request: { headers: { get: vi.fn().mockReturnValue('fr-FR,fr;q=0.9') } },
		} as any);
		expect(result.lang).toBe('fr');
	});

	it('falls back to English for unsupported browser language', async () => {
		const result = await layoutLoad({
			cookies: { get: vi.fn().mockReturnValue('') },
			request: { headers: { get: vi.fn().mockReturnValue('klingon') } },
		} as any);
		expect(result.lang).toBe('en');
	});

	it('exposes demoMode from env', async () => {
		mockEnv.env.DEMO_MODE = '1';
		const result = await layoutLoad({
			cookies: { get: vi.fn().mockReturnValue('') },
			request: { headers: { get: vi.fn().mockReturnValue('') } },
		} as any);
		expect(result.demoMode).toBe(true);
	});

	it('exposes chatbotEnabled from env', async () => {
		mockEnv.env.CHATBOT = 'true';
		const result = await layoutLoad({
			cookies: { get: vi.fn().mockReturnValue('') },
			request: { headers: { get: vi.fn().mockReturnValue('') } },
		} as any);
		expect(result.chatbotEnabled).toBe(true);
	});
});
