import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	json: (data: any) => new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } }),
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
}));

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockReelLogFindMany = vi.fn();
const mockReelLogFindFirst = vi.fn();
const mockComboFindFirst = vi.fn();

function makeSelectChain(result: any[] = []) {
	const self: any = {
		from: vi.fn(() => self),
		where: vi.fn(() => self),
		limit: vi.fn(() => Promise.resolve(result)),
		orderBy: vi.fn(() => self),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
		catch: (fn: any) => Promise.resolve(result).catch(fn),
	};
	return self;
}

function makeUpdateChain(result: any[] = []) {
	const terminal = {
		returning: vi.fn(() => Promise.resolve(result)),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
		catch: (fn: any) => Promise.resolve(result).catch(fn),
	};
	const self: any = {
		set: vi.fn(() => self),
		where: vi.fn(() => terminal),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
	};
	return self;
}

vi.mock('$lib/server/db', () => ({
	db: {
		select: mockSelect,
		update: mockUpdate,
		query: {
			reelLineLog: { findMany: mockReelLogFindMany, findFirst: mockReelLogFindFirst },
			combo: { findFirst: mockComboFindFirst },
		},
	},
}));

const { GET: getReels } = await import('../api/v1/reels/+server');
const { GET: getReelById } = await import('../api/v1/reels/[id]/+server');
const { GET: getRodById } = await import('../api/v1/rods/[id]/+server');
const { GET: getLineById } = await import('../api/v1/lines/[id]/+server');
const { GET: getComboById } = await import('../api/v1/combos/[id]/+server');
const { POST: shareCatchPost, DELETE: shareCatchDelete } = await import('../api/catches/[id]/share/+server');
const { POST: shareSpotPost, DELETE: shareSpotDelete } = await import('../api/spots/[id]/share/+server');

const mockEnv = await import('../../__mocks__/env');

// ─── GET /api/v1/reels ────────────────────────────────────────────────────────

describe('GET /api/v1/reels', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		mockReelLogFindMany.mockResolvedValue([]);
	});

	it('returns empty array when no reels', async () => {
		const res = await getReels({} as any);
		expect(await res.json()).toEqual([]);
	});

	it('attaches currentLine from most recent log entry', async () => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 're1', brand: 'Daiwa', model: 'Exist' }]));
		mockReelLogFindMany.mockResolvedValue([{
			reelId: 're1',
			lineId: 'l1',
			spooledAt: new Date('2025-01-01'),
			line: { brand: 'Sunline', model: 'FC Rock', type: 'Fluoro' }
		}]);
		const res = await getReels({} as any);
		const data = await res.json();
		expect(data[0].currentLine.brand).toBe('Sunline');
		expect(data[0].currentLine.type).toBe('Fluoro');
	});

	it('returns null currentLine when reel has no log entries', async () => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 're1', brand: 'Daiwa', model: 'Exist' }]));
		const res = await getReels({} as any);
		const data = await res.json();
		expect(data[0].currentLine).toBeNull();
	});

	it('uses the first log entry per reel (most recent)', async () => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 're1' }, { id: 're2' }]));
		mockReelLogFindMany.mockResolvedValue([
			{ reelId: 're1', lineId: 'l1', spooledAt: new Date('2025-06-01'), line: { brand: 'Sunline', model: 'A', type: 'Fluoro' } },
			{ reelId: 're1', lineId: 'l2', spooledAt: new Date('2024-01-01'), line: { brand: 'Daiwa', model: 'B', type: 'Mono' } },
		]);
		const res = await getReels({} as any);
		const data = await res.json();
		expect(data[0].currentLine.brand).toBe('Sunline');
		expect(data[1].currentLine).toBeNull();
	});
});

// ─── GET /api/v1/reels/:id ────────────────────────────────────────────────────

describe('GET /api/v1/reels/:id', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 're1', brand: 'Daiwa', model: 'Exist' }]));
		mockReelLogFindFirst.mockResolvedValue(undefined);
	});

	it('returns reel with null currentLine when no log', async () => {
		const res = await getReelById({ params: { id: 're1' } } as any);
		const data = await res.json();
		expect(data.brand).toBe('Daiwa');
		expect(data.currentLine).toBeNull();
	});

	it('returns reel with currentLine when log exists', async () => {
		mockReelLogFindFirst.mockResolvedValue({
			lineId: 'l1', spooledAt: new Date('2025-01-01'),
			line: { brand: 'Sunline', model: 'FC Rock', type: 'Fluoro' }
		});
		const res = await getReelById({ params: { id: 're1' } } as any);
		const data = await res.json();
		expect(data.currentLine.brand).toBe('Sunline');
		expect(data.currentLine.type).toBe('Fluoro');
	});

	it('returns null line fields when log has no associated line', async () => {
		mockReelLogFindFirst.mockResolvedValue({ lineId: null, spooledAt: new Date(), line: null });
		const res = await getReelById({ params: { id: 're1' } } as any);
		const data = await res.json();
		expect(data.currentLine.brand).toBeNull();
	});

	it('throws 404 when reel not found', async () => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		await expect(getReelById({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

// ─── GET /api/v1/rods/:id ─────────────────────────────────────────────────────

describe('GET /api/v1/rods/:id', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 'r1', brand: 'Shimano', model: 'Stradic' }]));
	});

	it('returns rod data', async () => {
		const res = await getRodById({ params: { id: 'r1' } } as any);
		const data = await res.json();
		expect(data.brand).toBe('Shimano');
		expect(data.model).toBe('Stradic');
	});

	it('throws 404 when rod not found', async () => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		await expect(getRodById({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

// ─── GET /api/v1/lines/:id ────────────────────────────────────────────────────

describe('GET /api/v1/lines/:id', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 'l1', brand: 'Sunline', model: 'FC Rock', type: 'Fluoro' }]));
	});

	it('returns line data', async () => {
		const res = await getLineById({ params: { id: 'l1' } } as any);
		const data = await res.json();
		expect(data.brand).toBe('Sunline');
		expect(data.type).toBe('Fluoro');
	});

	it('throws 404 when line not found', async () => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		await expect(getLineById({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

// ─── GET /api/v1/combos/:id ───────────────────────────────────────────────────

describe('GET /api/v1/combos/:id', () => {
	beforeEach(() => {
		mockComboFindFirst.mockResolvedValue({
			id: 'c1', name: 'Pike Setup',
			rod: { id: 'r1', brand: 'Shimano', model: 'Stradic', type: 'Spinning' },
			reel: { id: 're1', brand: 'Daiwa', model: 'Exist', size: '2500' },
		});
		mockReelLogFindFirst.mockResolvedValue(undefined);
	});

	it('returns combo with rod and reel summaries', async () => {
		const res = await getComboById({ params: { id: 'c1' } } as any);
		const data = await res.json();
		expect(data.name).toBe('Pike Setup');
		expect(data.rod.brand).toBe('Shimano');
		expect(data.reel.brand).toBe('Daiwa');
		expect(data.currentLine).toBeNull();
	});

	it('includes currentLine when reel has a log', async () => {
		mockReelLogFindFirst.mockResolvedValue({
			lineId: 'l1', spooledAt: new Date(),
			line: { brand: 'Sunline', model: 'FC Rock', type: 'Fluoro' }
		});
		const res = await getComboById({ params: { id: 'c1' } } as any);
		const data = await res.json();
		expect(data.currentLine.brand).toBe('Sunline');
	});

	it('returns null rod/reel when combo has none', async () => {
		mockComboFindFirst.mockResolvedValue({ id: 'c1', name: 'Bare Combo', rod: null, reel: null });
		const res = await getComboById({ params: { id: 'c1' } } as any);
		const data = await res.json();
		expect(data.rod).toBeNull();
		expect(data.reel).toBeNull();
		expect(data.currentLine).toBeNull();
	});

	it('throws 404 when combo not found', async () => {
		mockComboFindFirst.mockResolvedValue(undefined);
		await expect(getComboById({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

// ─── POST/DELETE /api/catches/:id/share ───────────────────────────────────────

describe('POST /api/catches/:id/share', () => {
	beforeEach(() => {
		mockUpdate.mockImplementation(() => makeUpdateChain([{ id: 'c1' }]));
		mockEnv.env.BASE_URL = 'http://localhost:5173';
	});

	it('creates a share token and returns shareUrl', async () => {
		const res = await shareCatchPost({ params: { id: 'c1' } } as any);
		const data = await res.json();
		expect(data.shareToken).toBeDefined();
		expect(data.shareUrl).toContain('/share/catches/');
	});

	it('throws 404 when catch not found', async () => {
		mockUpdate.mockImplementation(() => makeUpdateChain([]));
		await expect(shareCatchPost({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('DELETE /api/catches/:id/share', () => {
	beforeEach(() => {
		mockUpdate.mockImplementation(() => makeUpdateChain([{ id: 'c1' }]));
	});

	it('revokes share token and returns ok', async () => {
		const res = await shareCatchDelete({ params: { id: 'c1' } } as any);
		const data = await res.json();
		expect(data.ok).toBe(true);
	});

	it('throws 404 when catch not found', async () => {
		mockUpdate.mockImplementation(() => makeUpdateChain([]));
		await expect(shareCatchDelete({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

// ─── POST/DELETE /api/spots/:id/share ────────────────────────────────────────

describe('POST /api/spots/:id/share', () => {
	beforeEach(() => {
		mockUpdate.mockImplementation(() => makeUpdateChain([{ id: 's1' }]));
		mockEnv.env.BASE_URL = 'http://localhost:5173';
	});

	it('creates a share token and returns shareUrl', async () => {
		const res = await shareSpotPost({ params: { id: 's1' } } as any);
		const data = await res.json();
		expect(data.shareToken).toBeDefined();
		expect(data.shareUrl).toContain('/share/spots/');
	});

	it('throws 404 when spot not found', async () => {
		mockUpdate.mockImplementation(() => makeUpdateChain([]));
		await expect(shareSpotPost({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('DELETE /api/spots/:id/share', () => {
	beforeEach(() => {
		mockUpdate.mockImplementation(() => makeUpdateChain([{ id: 's1' }]));
	});

	it('revokes share token and returns ok', async () => {
		const res = await shareSpotDelete({ params: { id: 's1' } } as any);
		const data = await res.json();
		expect(data.ok).toBe(true);
	});

	it('throws 404 when spot not found', async () => {
		mockUpdate.mockImplementation(() => makeUpdateChain([]));
		await expect(shareSpotDelete({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});
