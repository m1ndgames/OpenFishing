import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
}));

vi.mock('qrcode', () => ({
	default: { toString: vi.fn().mockResolvedValue('<svg>qr</svg>') },
}));

vi.mock('$lib/server/biteIndex', () => ({
	fetchWeather: vi.fn().mockResolvedValue({ biteIndex: 7.5, temperature: 18 }),
}));

const mockFindFirstLure = vi.fn();
const mockFindFirstCatch = vi.fn();
const mockFindFirstSpot = vi.fn();
const mockFindManyCatches = vi.fn();
const mockSelect = vi.fn();

function makeChain(result: any = []) {
	const self: any = {
		from: vi.fn(() => self),
		where: vi.fn(() => self),
		orderBy: vi.fn(() => self),
		limit: vi.fn(() => self),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
		catch: (fn: any) => Promise.resolve(result).catch(fn),
	};
	return self;
}

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			lure: { findFirst: mockFindFirstLure },
			fishCatch: { findFirst: mockFindFirstCatch, findMany: mockFindManyCatches },
			spot: { findFirst: mockFindFirstSpot },
		},
		select: mockSelect,
	},
}));

const { load: lureLoad } = await import('../lures/[id]/+page.server');
const { load: catchLoad } = await import('../catches/[id]/+page.server');
const { load: spotLoad } = await import('../spots/[id]/+page.server');

const mockEnv = await import('../../__mocks__/env');

describe('lures/[id] load', () => {
	beforeEach(() => {
		mockEnv.env.BASE_URL = undefined;
		mockEnv.env.AUTH_PASSWORD = undefined;
		mockFindFirstLure.mockResolvedValue({
			id: 'lure-001', name: 'Silver Spinner', shareToken: null, tags: [],
		});
		mockFindManyCatches.mockResolvedValue([]);
	});

	it('returns lure, qrSvg, lureCatches, authEnabled, shareUrl', async () => {
		const result = await lureLoad({ params: { id: 'lure-001' } } as any);
		expect(result.lure.name).toBe('Silver Spinner');
		expect(result.qrSvg).toBe('<svg>qr</svg>');
		expect(result.lureCatches).toEqual([]);
		expect(result.authEnabled).toBe(false);
		expect(result.shareUrl).toBeNull();
	});

	it('throws 404 when lure is not found', async () => {
		mockFindFirstLure.mockResolvedValue(undefined);
		await expect(lureLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});

	it('builds shareUrl when shareToken is set', async () => {
		mockFindFirstLure.mockResolvedValue({
			id: 'lure-001', name: 'Silver Spinner', shareToken: 'token-abc', tags: [],
		});
		mockEnv.env.BASE_URL = 'https://fishing.example.com';
		const result = await lureLoad({ params: { id: 'lure-001' } } as any);
		expect(result.shareUrl).toBe('https://fishing.example.com/share/lures/token-abc');
	});

	it('sets authEnabled=true when AUTH_PASSWORD is set', async () => {
		mockEnv.env.AUTH_PASSWORD = 'secret';
		const result = await lureLoad({ params: { id: 'lure-001' } } as any);
		expect(result.authEnabled).toBe(true);
	});
});

describe('catches/[id] load', () => {
	beforeEach(() => {
		mockEnv.env.BASE_URL = undefined;
		mockEnv.env.AUTH_PASSWORD = undefined;
		mockFindFirstCatch.mockResolvedValue({
			id: 'catch-001', species: 'Pike', lat: 52.52, lng: 13.40,
			shareToken: null, photos: [], lure: null, combo: null,
		});
		mockSelect.mockImplementation(() => makeChain([]));
	});

	it('returns catch with nearby spot null when no spots exist', async () => {
		const result = await catchLoad({ params: { id: 'catch-001' } } as any);
		expect(result.catch.species).toBe('Pike');
		expect(result.nearbySpot).toBeNull();
	});

	it('throws 404 when catch is not found', async () => {
		mockFindFirstCatch.mockResolvedValue(undefined);
		await expect(catchLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});

	it('finds nearby spot within 100m', async () => {
		mockSelect.mockImplementation(() => makeChain([
			{ id: 'spot-001', name: 'Test Lake', lat: 52.5200, lng: 13.4001 },
		]));
		const result = await catchLoad({ params: { id: 'catch-001' } } as any);
		expect(result.nearbySpot).not.toBeNull();
		expect(result.nearbySpot?.name).toBe('Test Lake');
	});

	it('returns nearbySpot=null when catch has no coordinates', async () => {
		mockFindFirstCatch.mockResolvedValue({
			id: 'catch-001', species: 'Pike', lat: null, lng: null,
			shareToken: null, photos: [], lure: null, combo: null,
		});
		const result = await catchLoad({ params: { id: 'catch-001' } } as any);
		expect(result.nearbySpot).toBeNull();
	});

	it('builds shareUrl from shareToken', async () => {
		mockFindFirstCatch.mockResolvedValue({
			id: 'catch-001', species: 'Pike', lat: 52.52, lng: 13.40,
			shareToken: 'tok', photos: [], lure: null, combo: null,
		});
		mockEnv.env.BASE_URL = 'https://f.example.com';
		const result = await catchLoad({ params: { id: 'catch-001' } } as any);
		expect(result.shareUrl).toBe('https://f.example.com/share/catches/tok');
	});
});

describe('spots/[id] load', () => {
	beforeEach(() => {
		mockEnv.env.BASE_URL = undefined;
		mockEnv.env.AUTH_PASSWORD = undefined;
		mockFindFirstSpot.mockResolvedValue({
			id: 'spot-001', name: 'Test Lake', lat: 52.52, lng: 13.40,
			shareToken: null, tags: [], photos: [],
		});
		mockFindManyCatches.mockResolvedValue([]);
		mockSelect.mockImplementation(() => makeChain([
			{ id: 'spot-001', lat: 52.52, lng: 13.40 },
		]));
	});

	it('returns spot with weather and empty nearby catches', async () => {
		const result = await spotLoad({ params: { id: 'spot-001' } } as any);
		expect(result.spot.name).toBe('Test Lake');
		expect(result.nearbyCatches).toEqual([]);
		expect(result.weather).toBeDefined();
	});

	it('throws 404 when spot is not found', async () => {
		mockFindFirstSpot.mockResolvedValue(undefined);
		await expect(spotLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});

	it('includes nearby catches within 100m', async () => {
		mockFindManyCatches.mockResolvedValue([{
			id: 'c1', lat: 52.5200, lng: 13.4001, caughtAt: new Date(),
			lure: null, photos: [],
		}]);
		const result = await spotLoad({ params: { id: 'spot-001' } } as any);
		expect(result.nearbyCatches).toHaveLength(1);
	});

	it('excludes catches further than 100m', async () => {
		mockFindManyCatches.mockResolvedValue([{
			id: 'c1', lat: 53.0, lng: 14.0, caughtAt: new Date(),
			lure: null, photos: [],
		}]);
		const result = await spotLoad({ params: { id: 'spot-001' } } as any);
		expect(result.nearbyCatches).toHaveLength(0);
	});

	it('excludes catches with no coordinates', async () => {
		mockFindManyCatches.mockResolvedValue([{
			id: 'c1', lat: null, lng: null, caughtAt: new Date(),
			lure: null, photos: [],
		}]);
		const result = await spotLoad({ params: { id: 'spot-001' } } as any);
		expect(result.nearbyCatches).toHaveLength(0);
	});

	it('builds shareUrl from shareToken', async () => {
		mockFindFirstSpot.mockResolvedValue({
			id: 'spot-001', name: 'Lake', lat: 52.52, lng: 13.40,
			shareToken: 'tok', tags: [], photos: [],
		});
		mockEnv.env.BASE_URL = 'https://f.example.com';
		const result = await spotLoad({ params: { id: 'spot-001' } } as any);
		expect(result.shareUrl).toBe('https://f.example.com/share/spots/tok');
	});
});
