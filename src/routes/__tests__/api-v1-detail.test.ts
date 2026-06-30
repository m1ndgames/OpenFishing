import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	json: (data: any) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }),
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
}));

const mockLureFindFirst = vi.fn();
const mockCatchFindFirst = vi.fn();
const mockSpotFindFirst = vi.fn();
const mockRodFindMany = vi.fn();
const mockReelFindMany = vi.fn();
const mockLineFindMany = vi.fn();
const mockComboFindMany = vi.fn();
const mockReelLogFindMany = vi.fn();
const mockUpdate = vi.fn();
const mockSelectDistinct = vi.fn();
const mockLureFindMany = vi.fn();
const mockCatchFindMany = vi.fn();

function makeChain(result: any = []) {
	const terminal = {
		returning: vi.fn(() => Promise.resolve(result)),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
		catch: (fn: any) => Promise.resolve(result).catch(fn),
	};
	const self: any = {
		from: vi.fn(() => self),
		set: vi.fn(() => self),
		where: vi.fn(() => terminal),
		orderBy: vi.fn(() => self),
		returning: vi.fn(() => Promise.resolve(result)),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
		catch: (fn: any) => Promise.resolve(result).catch(fn),
	};
	return self;
}

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			lure: { findFirst: mockLureFindFirst, findMany: mockLureFindMany },
			fishCatch: { findFirst: mockCatchFindFirst, findMany: mockCatchFindMany },
			spot: { findFirst: mockSpotFindFirst },
			rod: { findMany: mockRodFindMany },
			reel: { findMany: mockReelFindMany },
			fishingLine: { findMany: mockLineFindMany },
			combo: { findMany: mockComboFindMany },
			reelLineLog: { findMany: mockReelLogFindMany },
		},
		update: mockUpdate,
		selectDistinct: mockSelectDistinct,
	},
}));

const { GET: getLureById } = await import('../api/v1/lures/[id]/+server');
const { GET: getCatchById } = await import('../api/v1/catches/[id]/+server');
const { GET: getSpotById } = await import('../api/v1/spots/[id]/+server');
const { GET: getCombos } = await import('../api/v1/combos/+server');
const { POST: shareLurePost, DELETE: shareLureDelete } = await import('../api/lures/[id]/share/+server');
const { load: luresOverviewLoad } = await import('../+page.server');
const { load: catchesLoad } = await import('../catches/+page.server');

describe('GET /api/v1/lures/:id', () => {
	it('returns the lure without photoPath', async () => {
		mockLureFindFirst.mockResolvedValue({
			id: 'l1', name: 'Spinner', photoPath: 'x.jpg',
			tags: [{ id: 't1', name: 'river' }]
		});
		const res = await getLureById({ params: { id: 'l1' } } as any);
		const data = await res.json();
		expect(data.name).toBe('Spinner');
		expect(data.photoPath).toBeUndefined();
		expect(data.tags).toEqual(['river']);
	});

	it('throws 404 when lure not found', async () => {
		mockLureFindFirst.mockResolvedValue(undefined);
		await expect(getLureById({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('GET /api/v1/catches/:id', () => {
	it('returns catch with lure summary', async () => {
		mockCatchFindFirst.mockResolvedValue({
			id: 'c1', species: 'Pike',
			lure: { id: 'l1', name: 'Spinner', photoPath: 'x.jpg', brand: 'Mepps' }
		});
		const res = await getCatchById({ params: { id: 'c1' } } as any);
		const data = await res.json();
		expect(data.species).toBe('Pike');
		expect(data.lure).toEqual({ id: 'l1', name: 'Spinner' });
	});

	it('throws 404 when catch not found', async () => {
		mockCatchFindFirst.mockResolvedValue(undefined);
		await expect(getCatchById({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('GET /api/v1/spots/:id', () => {
	it('returns the spot with tags as strings', async () => {
		mockSpotFindFirst.mockResolvedValue({
			id: 's1', name: 'Lake', tags: [{ id: 't1', name: 'carp' }]
		});
		const res = await getSpotById({ params: { id: 's1' } } as any);
		const data = await res.json();
		expect(data.name).toBe('Lake');
		expect(data.tags).toEqual(['carp']);
	});

	it('throws 404 when spot not found', async () => {
		mockSpotFindFirst.mockResolvedValue(undefined);
		await expect(getSpotById({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('GET /api/v1/combos', () => {
	beforeEach(() => {
		mockComboFindMany.mockResolvedValue([]);
		mockReelLogFindMany.mockResolvedValue([]);
	});

	it('returns empty array when no combos', async () => {
		const res = await getCombos({} as any);
		expect(await res.json()).toEqual([]);
	});

	it('returns combo with rod and reel summaries', async () => {
		mockComboFindMany.mockResolvedValue([{
			id: 'combo1', name: 'Pike Setup',
			rod: { id: 'r1', brand: 'Shimano', model: 'Test', type: 'Spinning' },
			reel: { id: 're1', brand: 'Daiwa', model: 'Test', size: '2500' },
		}]);
		const res = await getCombos({} as any);
		const data = await res.json();
		expect(data[0].rod.brand).toBe('Shimano');
		expect(data[0].reel.brand).toBe('Daiwa');
		expect(data[0].currentLine).toBeNull();
	});

	it('includes currentLine when a log entry exists for the reel', async () => {
		mockComboFindMany.mockResolvedValue([{
			id: 'combo1', name: 'Pike Setup',
			rod: null,
			reel: { id: 're1', brand: 'Daiwa', model: 'Test', size: '2500' },
		}]);
		mockReelLogFindMany.mockResolvedValue([{
			reelId: 're1', lineId: 'line1', spooledAt: new Date(),
			line: { brand: 'Sunline', model: 'FC Rock', type: 'Fluoro' },
		}]);
		const res = await getCombos({} as any);
		const data = await res.json();
		expect(data[0].currentLine).not.toBeNull();
		expect(data[0].currentLine.brand).toBe('Sunline');
	});
});

describe('POST /api/lures/:id/share', () => {
	beforeEach(() => {
		mockUpdate.mockImplementation(() => makeChain([{ id: 'l1' }]));
	});

	it('creates a share token and returns shareUrl', async () => {
		const res = await shareLurePost({ params: { id: 'l1' } } as any);
		const data = await res.json();
		expect(data.shareToken).toBeDefined();
		expect(data.shareUrl).toContain('/share/lures/');
	});

	it('throws 404 when lure not found', async () => {
		mockUpdate.mockImplementation(() => makeChain([]));
		await expect(shareLurePost({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('DELETE /api/lures/:id/share', () => {
	beforeEach(() => {
		mockUpdate.mockImplementation(() => makeChain([{ id: 'l1' }]));
	});

	it('revokes share token and returns ok', async () => {
		const res = await shareLureDelete({ params: { id: 'l1' } } as any);
		const data = await res.json();
		expect(data.ok).toBe(true);
	});

	it('throws 404 when lure not found', async () => {
		mockUpdate.mockImplementation(() => makeChain([]));
		await expect(shareLureDelete({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('lures overview / load', () => {
	beforeEach(() => {
		mockLureFindMany.mockResolvedValue([]);
		mockSelectDistinct.mockImplementation(() => makeChain([]));
	});

	it('returns lures and lureIdsWithCatches', async () => {
		const result = await luresOverviewLoad({ locals: { user: null } } as any);
		expect(result.lures).toEqual([]);
		expect(result.lureIdsWithCatches).toEqual([]);
	});

	it('builds lureIdsWithCatches set from catch rows', async () => {
		mockSelectDistinct.mockImplementation(() => makeChain([{ lureId: 'l1' }, { lureId: 'l2' }]));
		const result = await luresOverviewLoad({ locals: { user: null } } as any);
		expect(result.lureIdsWithCatches).toContain('l1');
		expect(result.lureIdsWithCatches).toContain('l2');
	});
});

describe('catches list / load', () => {
	beforeEach(() => {
		mockCatchFindMany.mockResolvedValue([]);
	});

	it('returns catches array', async () => {
		const result = await catchesLoad({ locals: { user: null } } as any);
		expect(result.catches).toEqual([]);
	});
});
