import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFindMany = vi.fn();
const mockSelectFrom = vi.fn();

function makeSelectChain(result: any[]) {
	const chain: any = {
		from: vi.fn(() => chain),
		orderBy: vi.fn(() => chain),
		where: vi.fn(() => chain),
		limit: vi.fn(() => chain),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
		catch: (fn: any) => Promise.resolve(result).catch(fn),
	};
	return chain;
}

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			fishCatch: { findMany: mockFindMany },
		},
		select: mockSelectFrom,
	},
}));

// Import after mocks are registered
const { load } = await import('../stats/+page.server');

const BASE_DATE = new Date('2025-06-15T08:00:00Z');

function makeCatch(overrides: Partial<{
	id: string; species: string; weightG: number; lengthCm: number;
	lat: number; lng: number; catchAndRelease: boolean; caughtAt: Date;
	presentation: string; lure: any;
}> = {}) {
	return {
		id: 'c1',
		species: 'Pike',
		weightG: 1500,
		lengthCm: 55,
		lat: 52.52,
		lng: 13.40,
		catchAndRelease: false,
		caughtAt: BASE_DATE,
		presentation: 'Slow retrieve',
		lure: { id: 'l1', name: 'Silver Spinner', lureNumber: 1, brand: 'Mepps' },
		...overrides,
	};
}

describe('stats load — empty database', () => {
	beforeEach(() => {
		mockFindMany.mockResolvedValue([]);
		mockSelectFrom.mockImplementation(() => makeSelectChain([]));
	});

	it('returns zero totals', async () => {
		const result = await load({ locals: { user: null } } as any);
		expect(result.totals.totalCatches).toBe(0);
		expect(result.totals.cnrCount).toBe(0);
		expect(result.totals.cnrRate).toBe(0);
		expect(result.totals.distinctSpecies).toBe(0);
		expect(result.totals.totalSpots).toBe(0);
	});

	it('returns empty arrays for all stat groups', async () => {
		const result = await load({ locals: { user: null } } as any);
		expect(result.speciesStats).toHaveLength(0);
		expect(result.lureStats).toHaveLength(0);
		expect(result.spotStats).toHaveLength(0);
		expect(result.presentationStats).toHaveLength(0);
	});

	it('returns 12 months', async () => {
		const result = await load({ locals: { user: null } } as any);
		expect(result.months).toHaveLength(12);
		expect(result.months.every((m: any) => m.count === 0)).toBe(true);
	});

	it('returns 24 hourly buckets', async () => {
		const result = await load({ locals: { user: null } } as any);
		expect(result.hourly).toHaveLength(24);
	});

	it('returns 7 weekday buckets starting from Monday', async () => {
		const result = await load({ locals: { user: null } } as any);
		expect(result.weekdays).toHaveLength(7);
		expect(result.weekdays[0].day).toBe(1); // Monday
		expect(result.weekdays[6].day).toBe(0); // Sunday moved to end
	});
});

describe('stats load — with catches', () => {
	beforeEach(() => {
		mockSelectFrom.mockImplementation(() => makeSelectChain([]));
	});

	it('counts total catches', async () => {
		mockFindMany.mockResolvedValue([makeCatch(), makeCatch({ id: 'c2', species: 'Perch' })]);
		const result = await load({ locals: { user: null } } as any);
		expect(result.totals.totalCatches).toBe(2);
	});

	it('counts distinct species', async () => {
		mockFindMany.mockResolvedValue([
			makeCatch({ species: 'Pike' }),
			makeCatch({ id: 'c2', species: 'Perch' }),
			makeCatch({ id: 'c3', species: 'Pike' }),
		]);
		const result = await load({ locals: { user: null } } as any);
		expect(result.totals.distinctSpecies).toBe(2);
	});

	it('computes catch-and-release rate', async () => {
		mockFindMany.mockResolvedValue([
			makeCatch({ catchAndRelease: true }),
			makeCatch({ id: 'c2', catchAndRelease: false }),
		]);
		const result = await load({ locals: { user: null } } as any);
		expect(result.totals.cnrCount).toBe(1);
		expect(result.totals.cnrRate).toBe(50);
	});

	it('builds species stats sorted by count descending', async () => {
		mockFindMany.mockResolvedValue([
			makeCatch({ species: 'Pike' }),
			makeCatch({ id: 'c2', species: 'Perch' }),
			makeCatch({ id: 'c3', species: 'Pike' }),
		]);
		const result = await load({ locals: { user: null } } as any);
		expect(result.speciesStats[0].species).toBe('Pike');
		expect(result.speciesStats[0].count).toBe(2);
		expect(result.speciesStats[1].species).toBe('Perch');
	});

	it('tracks personal bests per species', async () => {
		mockFindMany.mockResolvedValue([
			makeCatch({ species: 'Pike', weightG: 1000, lengthCm: 50, id: 'c1' }),
			makeCatch({ species: 'Pike', weightG: 2000, lengthCm: 40, id: 'c2' }),
		]);
		const result = await load({ locals: { user: null } } as any);
		const pike = result.speciesStats.find((s: any) => s.species === 'Pike');
		expect(pike.maxWeight).toBe(2000);
		expect(pike.maxWeightId).toBe('c2');
		expect(pike.maxLength).toBe(50);
		expect(pike.maxLengthId).toBe('c1');
	});

	it('counts CNR per species', async () => {
		mockFindMany.mockResolvedValue([
			makeCatch({ species: 'Pike', catchAndRelease: true }),
			makeCatch({ id: 'c2', species: 'Pike', catchAndRelease: false }),
		]);
		const result = await load({ locals: { user: null } } as any);
		const pike = result.speciesStats.find((s: any) => s.species === 'Pike');
		expect(pike.cnr).toBe(1);
	});

	it('skips catches with no species in species stats', async () => {
		mockFindMany.mockResolvedValue([
			makeCatch({ species: null as any }),
		]);
		const result = await load({ locals: { user: null } } as any);
		expect(result.speciesStats).toHaveLength(0);
	});

	it('builds lure stats capped at 8', async () => {
		const catches = Array.from({ length: 10 }, (_, i) =>
			makeCatch({ id: `c${i}`, lure: { id: `l${i}`, name: `Lure ${i}`, lureNumber: i, brand: 'X' } })
		);
		mockFindMany.mockResolvedValue(catches);
		const result = await load({ locals: { user: null } } as any);
		expect(result.lureStats.length).toBeLessThanOrEqual(8);
	});

	it('skips catches with no lure in lure stats', async () => {
		mockFindMany.mockResolvedValue([makeCatch({ lure: null as any })]);
		const result = await load({ locals: { user: null } } as any);
		expect(result.lureStats).toHaveLength(0);
	});

	it('buckets catches into hourly bins', async () => {
		mockFindMany.mockResolvedValue([makeCatch(), makeCatch({ id: 'c2' })]);
		const result = await load({ locals: { user: null } } as any);
		// Use getHours() — same local interpretation the code uses
		const expectedHour = new Date(BASE_DATE).getHours();
		const bucket = result.hourly.find((h: any) => h.hour === expectedHour);
		expect(bucket?.count).toBe(2);
	});

	it('buckets catches into weekday bins', async () => {
		// 2025-06-15 is a Sunday (day=0)
		mockFindMany.mockResolvedValue([makeCatch()]);
		const result = await load({ locals: { user: null } } as any);
		const sunday = result.weekdays.find((w: any) => w.day === 0);
		expect(sunday?.count).toBe(1);
	});

	it('builds presentation stats sorted by count', async () => {
		mockFindMany.mockResolvedValue([
			makeCatch({ presentation: 'Fast' }),
			makeCatch({ id: 'c2', presentation: 'Slow retrieve' }),
			makeCatch({ id: 'c3', presentation: 'Fast' }),
		]);
		const result = await load({ locals: { user: null } } as any);
		expect(result.presentationStats[0].style).toBe('Fast');
		expect(result.presentationStats[0].count).toBe(2);
	});

	it('skips catches with no presentation', async () => {
		mockFindMany.mockResolvedValue([makeCatch({ presentation: null as any })]);
		const result = await load({ locals: { user: null } } as any);
		expect(result.presentationStats).toHaveLength(0);
	});
});

describe('stats load — spot productivity', () => {
	it('links catches to nearby spots within 100m', async () => {
		mockFindMany.mockResolvedValue([
			makeCatch({ lat: 52.5200, lng: 13.4000 }),
		]);
		// Spot is ~5m away
		mockSelectFrom.mockImplementation(() => makeSelectChain([
			{ id: 'spot1', name: 'Test Lake', lat: 52.5200, lng: 13.4001 },
		]));
		const result = await load({ locals: { user: null } } as any);
		expect(result.spotStats).toHaveLength(1);
		expect(result.spotStats[0].name).toBe('Test Lake');
		expect(result.spotStats[0].count).toBe(1);
	});

	it('ignores catches more than 100m from any spot', async () => {
		mockFindMany.mockResolvedValue([
			makeCatch({ lat: 52.5200, lng: 13.4000 }),
		]);
		// Spot is ~1km away
		mockSelectFrom.mockImplementation(() => makeSelectChain([
			{ id: 'spot1', name: 'Distant Lake', lat: 52.5300, lng: 13.4000 },
		]));
		const result = await load({ locals: { user: null } } as any);
		expect(result.spotStats).toHaveLength(0);
	});

	it('ignores catches without coordinates', async () => {
		mockFindMany.mockResolvedValue([
			makeCatch({ lat: null as any, lng: null as any }),
		]);
		mockSelectFrom.mockImplementation(() => makeSelectChain([
			{ id: 'spot1', name: 'Lake', lat: 52.52, lng: 13.40 },
		]));
		const result = await load({ locals: { user: null } } as any);
		expect(result.spotStats).toHaveLength(0);
	});
});
