import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Reset call counts between every test so assertions like "not.toHaveBeenCalled"
// don't see calls made in earlier describe blocks.
afterEach(() => { vi.clearAllMocks(); });

vi.mock('@sveltejs/kit', () => ({
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
	fail: (status: number, data: any) => ({ status, data }),
	redirect: (status: number, location: string) => { throw { status, location }; },
}));

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockInsert = vi.fn();
const mockComboFindMany = vi.fn();
const mockComboFindFirst = vi.fn();
const mockReelLogFindMany = vi.fn();
const mockReelLogFindFirst = vi.fn();

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

function makeUpdateChain() {
	const self: any = {
		set: vi.fn(() => self),
		where: vi.fn(() => Promise.resolve()),
	};
	return self;
}

function makeDeleteChain() {
	return { where: vi.fn(() => Promise.resolve()) };
}

function makeInsertChain(result: any[] = []) {
	const self: any = {
		values: vi.fn(() => self),
		returning: vi.fn(() => Promise.resolve(result)),
	};
	return self;
}

vi.mock('$lib/server/db', () => ({
	db: {
		select: mockSelect,
		update: mockUpdate,
		delete: mockDelete,
		insert: mockInsert,
		query: {
			combo: { findMany: mockComboFindMany, findFirst: mockComboFindFirst },
			reelLineLog: { findMany: mockReelLogFindMany, findFirst: mockReelLogFindFirst },
		},
	},
}));

function makeRequest(fields: Record<string, string> = {}): any {
	const fd = new FormData();
	for (const [k, v] of Object.entries(fields)) fd.append(k, v);
	return { formData: () => Promise.resolve(fd) };
}

// ─── Rod routes ───────────────────────────────────────────────────────────────

const { load: rodLoad } = await import('../tackle/rods/[id]/+page.server');
const { load: rodEditLoad, actions: rodEditActions } = await import('../tackle/rods/[id]/edit/+page.server');
const { actions: rodNewActions } = await import('../tackle/rods/new/+page.server');

describe('tackle/rods/[id] load', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 'r1', model: 'Test', brand: 'Shimano' }]));
		mockComboFindMany.mockResolvedValue([]);
	});

	it('returns rod and linked combos', async () => {
		const result = await rodLoad({ params: { id: 'r1' } } as any);
		expect(result.rod.model).toBe('Test');
		expect(result.combos).toEqual([]);
	});

	it('throws 404 when rod not found', async () => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		await expect(rodLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('tackle/rods/[id]/edit', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 'r1', model: 'Test' }]));
		mockUpdate.mockReturnValue(makeUpdateChain());
		mockDelete.mockReturnValue(makeDeleteChain());
	});

	it('load returns rod', async () => {
		const result = await rodEditLoad({ params: { id: 'r1' } } as any);
		expect(result.rod.model).toBe('Test');
	});

	it('load throws 404 when not found', async () => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		await expect(rodEditLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});

	it('update validates model is required', async () => {
		const result = await rodEditActions.update({ request: makeRequest({ model: '' }), params: { id: 'r1' } } as any);
		expect(result.status).toBe(400);
	});

	it('update parses optional numeric fields and redirects', async () => {
		await expect(
			rodEditActions.update({ request: makeRequest({ model: 'Stradic', length_m: '2.7', casting_weight: '10-30g' }), params: { id: 'r1' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/tackle/rods/r1' });
	});

	it('delete redirects to /tackle', async () => {
		await expect(
			rodEditActions.delete({ params: { id: 'r1' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/tackle' });
	});
});

describe('tackle/rods/new actions', () => {
	beforeEach(() => {
		mockInsert.mockReturnValue(makeInsertChain([{ id: 'new-r1' }]));
	});

	it('validates model is required', async () => {
		const result = await rodNewActions.default({ request: makeRequest({}) } as any);
		expect(result.status).toBe(400);
	});

	it('creates rod and redirects', async () => {
		await expect(
			rodNewActions.default({ request: makeRequest({ model: 'Stradic CI4+', length_m: '2.7' }) } as any)
		).rejects.toMatchObject({ status: 303, location: '/tackle/rods/new-r1' });
	});

	it('handles missing optional fields gracefully', async () => {
		await expect(
			rodNewActions.default({ request: makeRequest({ model: 'Basic Rod' }) } as any)
		).rejects.toMatchObject({ status: 303 });
	});
});

// ─── Reel routes ──────────────────────────────────────────────────────────────

const { load: reelLoad, actions: reelDetailActions } = await import('../tackle/reels/[id]/+page.server');
const { load: reelEditLoad, actions: reelEditActions } = await import('../tackle/reels/[id]/edit/+page.server');
const { actions: reelNewActions } = await import('../tackle/reels/new/+page.server');

describe('tackle/reels/[id] load', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 're1', model: 'Stradic', brand: 'Shimano' }]));
		mockReelLogFindMany.mockResolvedValue([]);
		mockComboFindMany.mockResolvedValue([]);
	});

	it('returns reel with lineLogs and combos', async () => {
		const result = await reelLoad({ params: { id: 're1' } } as any);
		expect(result.reel.model).toBe('Stradic');
		expect(result.lineLogs).toEqual([]);
		expect(result.combos).toEqual([]);
	});

	it('throws 404 when reel not found', async () => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		await expect(reelLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});

	it('addLine validates spooledAt is required', async () => {
		const result = await reelDetailActions.addLine({ request: makeRequest({}), params: { id: 're1' } } as any);
		expect(result.status).toBe(400);
	});

	it('addLine inserts log and redirects', async () => {
		mockInsert.mockReturnValue(makeInsertChain([]));
		await expect(
			reelDetailActions.addLine({ request: makeRequest({ spooled_at: '2025-01-01', line_id: 'l1' }), params: { id: 're1' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/tackle/reels/re1' });
	});

	it('deleteLine skips delete when log_id absent', async () => {
		await expect(
			reelDetailActions.deleteLine({ request: makeRequest({}), params: { id: 're1' } } as any)
		).rejects.toMatchObject({ status: 303 });
		expect(mockDelete).not.toHaveBeenCalled();
	});

	it('deleteLine deletes log and redirects', async () => {
		mockDelete.mockReturnValue(makeDeleteChain());
		await expect(
			reelDetailActions.deleteLine({ request: makeRequest({ log_id: 'log1' }), params: { id: 're1' } } as any)
		).rejects.toMatchObject({ status: 303 });
	});
});

describe('tackle/reels/[id]/edit', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 're1', model: 'Stradic' }]));
		mockUpdate.mockReturnValue(makeUpdateChain());
		mockDelete.mockReturnValue(makeDeleteChain());
	});

	it('load returns reel', async () => {
		const result = await reelEditLoad({ params: { id: 're1' } } as any);
		expect(result.reel.model).toBe('Stradic');
	});

	it('load throws 404 when not found', async () => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		await expect(reelEditLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});

	it('update validates model is required', async () => {
		const result = await reelEditActions.update({ request: makeRequest({}), params: { id: 're1' } } as any);
		expect(result.status).toBe(400);
	});

	it('update redirects on success', async () => {
		await expect(
			reelEditActions.update({ request: makeRequest({ model: 'Stradic 2500' }), params: { id: 're1' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/tackle/reels/re1' });
	});

	it('delete redirects to /tackle', async () => {
		await expect(
			reelEditActions.delete({ params: { id: 're1' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/tackle' });
	});
});

describe('tackle/reels/new actions', () => {
	beforeEach(() => {
		mockInsert.mockReturnValue(makeInsertChain([{ id: 'new-re1' }]));
	});

	it('validates model is required', async () => {
		const result = await reelNewActions.default({ request: makeRequest({}) } as any);
		expect(result.status).toBe(400);
	});

	it('creates reel and redirects', async () => {
		await expect(
			reelNewActions.default({ request: makeRequest({ model: 'Stradic 2500', size: '2500' }) } as any)
		).rejects.toMatchObject({ status: 303, location: '/tackle/reels/new-re1' });
	});
});

// ─── Line routes ──────────────────────────────────────────────────────────────

const { load: lineLoad } = await import('../tackle/lines/[id]/+page.server');
const { load: lineEditLoad, actions: lineEditActions } = await import('../tackle/lines/[id]/edit/+page.server');
const { actions: lineNewActions } = await import('../tackle/lines/new/+page.server');

describe('tackle/lines/[id] load', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 'l1', model: 'FC Rock', brand: 'Sunline' }]));
		mockReelLogFindMany.mockResolvedValue([]);
	});

	it('returns line and usage logs', async () => {
		const result = await lineLoad({ params: { id: 'l1' } } as any);
		expect(result.line.model).toBe('FC Rock');
		expect(result.logs).toEqual([]);
	});

	it('throws 404 when not found', async () => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		await expect(lineLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('tackle/lines/[id]/edit', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([{ id: 'l1', model: 'FC Rock' }]));
		mockUpdate.mockReturnValue(makeUpdateChain());
		mockDelete.mockReturnValue(makeDeleteChain());
	});

	it('load returns line', async () => {
		const result = await lineEditLoad({ params: { id: 'l1' } } as any);
		expect(result.line.model).toBe('FC Rock');
	});

	it('load throws 404 when not found', async () => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		await expect(lineEditLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});

	it('update validates model is required', async () => {
		const result = await lineEditActions.update({ request: makeRequest({}), params: { id: 'l1' } } as any);
		expect(result.status).toBe(400);
	});

	it('update parses numeric fields and redirects', async () => {
		await expect(
			lineEditActions.update({
				request: makeRequest({ model: 'FC Rock', diameter_mm: '0.16', strength_kg: '3.5' }),
				params: { id: 'l1' }
			} as any)
		).rejects.toMatchObject({ status: 303, location: '/tackle/lines/l1' });
	});

	it('delete redirects to /tackle', async () => {
		await expect(lineEditActions.delete({ params: { id: 'l1' } } as any)).rejects.toMatchObject({ location: '/tackle' });
	});
});

describe('tackle/lines/new actions', () => {
	beforeEach(() => {
		mockInsert.mockReturnValue(makeInsertChain([{ id: 'new-l1' }]));
	});

	it('validates model is required', async () => {
		const result = await lineNewActions.default({ request: makeRequest({}) } as any);
		expect(result.status).toBe(400);
	});

	it('creates line and redirects', async () => {
		await expect(
			lineNewActions.default({ request: makeRequest({ model: 'FC Rock', type: 'Fluoro', diameter_mm: '0.16' }) } as any)
		).rejects.toMatchObject({ location: '/tackle/lines/new-l1' });
	});
});

// ─── Combo routes ─────────────────────────────────────────────────────────────

const { load: comboDetailLoad } = await import('../tackle/combos/[id]/+page.server');
const { load: comboEditLoad, actions: comboEditActions } = await import('../tackle/combos/[id]/edit/+page.server');
const { load: comboNewLoad, actions: comboNewActions } = await import('../tackle/combos/new/+page.server');

describe('tackle/combos/[id] load', () => {
	beforeEach(() => {
		mockComboFindFirst.mockResolvedValue({ id: 'c1', name: 'Pike Setup', reelId: null, rod: null, reel: null });
		mockReelLogFindFirst.mockResolvedValue(undefined);
	});

	it('returns combo with null currentLine when no reel', async () => {
		const result = await comboDetailLoad({ params: { id: 'c1' } } as any);
		expect(result.combo.name).toBe('Pike Setup');
		expect(result.currentLine).toBeNull();
	});

	it('returns currentLine when reel has a spooled line', async () => {
		mockComboFindFirst.mockResolvedValue({ id: 'c1', name: 'Setup', reelId: 're1', rod: null, reel: null });
		mockReelLogFindFirst.mockResolvedValue({
			spooledAt: new Date('2025-01-01'),
			line: { brand: 'Sunline', model: 'FC Rock' }
		});
		const result = await comboDetailLoad({ params: { id: 'c1' } } as any);
		expect(result.currentLine?.lineName).toBe('Sunline FC Rock');
	});

	it('returns null currentLine when reel has log but no line', async () => {
		mockComboFindFirst.mockResolvedValue({ id: 'c1', name: 'Setup', reelId: 're1', rod: null, reel: null });
		mockReelLogFindFirst.mockResolvedValue({ spooledAt: new Date(), line: null });
		const result = await comboDetailLoad({ params: { id: 'c1' } } as any);
		expect(result.currentLine).toBeNull();
	});

	it('throws 404 when combo not found', async () => {
		mockComboFindFirst.mockResolvedValue(undefined);
		await expect(comboDetailLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('tackle/combos/[id]/edit', () => {
	beforeEach(() => {
		mockComboFindFirst.mockResolvedValue({ id: 'c1', name: 'Pike Setup', rod: null, reel: null });
		mockSelect.mockReturnValue(makeSelectChain([]));
		mockUpdate.mockReturnValue(makeUpdateChain());
		mockDelete.mockReturnValue(makeDeleteChain());
	});

	it('load returns combo, rods, reels', async () => {
		const result = await comboEditLoad({ params: { id: 'c1' } } as any);
		expect(result.combo.name).toBe('Pike Setup');
		expect(result.rods).toEqual([]);
	});

	it('load throws 404 when not found', async () => {
		mockComboFindFirst.mockResolvedValue(undefined);
		await expect(comboEditLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});

	it('update validates name is required', async () => {
		const result = await comboEditActions.update({ request: makeRequest({}), params: { id: 'c1' } } as any);
		expect(result.status).toBe(400);
	});

	it('update redirects on success', async () => {
		await expect(
			comboEditActions.update({ request: makeRequest({ name: 'Pike Setup' }), params: { id: 'c1' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/tackle/combos/c1' });
	});

	it('delete redirects to /tackle', async () => {
		await expect(comboEditActions.delete({ params: { id: 'c1' } } as any)).rejects.toMatchObject({ location: '/tackle' });
	});
});

describe('tackle/combos/new', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		mockInsert.mockReturnValue(makeInsertChain([{ id: 'new-c1' }]));
	});

	it('load returns available rods and reels', async () => {
		const result = await comboNewLoad();
		expect(result.rods).toEqual([]);
		expect(result.reels).toEqual([]);
	});

	it('default action validates name is required', async () => {
		const result = await comboNewActions.default({ request: makeRequest({}) } as any);
		expect(result.status).toBe(400);
	});

	it('default action creates combo and redirects', async () => {
		await expect(
			comboNewActions.default({ request: makeRequest({ name: 'Pike Setup', rod_id: 'r1', reel_id: 're1' }) } as any)
		).rejects.toMatchObject({ location: '/tackle/combos/new-c1' });
	});
});
