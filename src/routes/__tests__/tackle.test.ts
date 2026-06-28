import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn();
const mockFindManyCombo = vi.fn();
const mockFindFirstLog = vi.fn();

function makeChain(result: any = []) {
	const self: any = {
		from: vi.fn(() => self),
		where: vi.fn(() => Promise.resolve(result)),
		orderBy: vi.fn(() => self),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
		catch: (fn: any) => Promise.resolve(result).catch(fn),
	};
	return self;
}

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			combo: { findMany: mockFindManyCombo },
			reelLineLog: { findFirst: mockFindFirstLog },
		},
		select: mockSelect,
	},
}));

const { load } = await import('../tackle/+page.server');

describe('tackle load', () => {
	beforeEach(() => {
		mockSelect.mockImplementation(() => makeChain([]));
		mockFindManyCombo.mockResolvedValue([]);
		mockFindFirstLog.mockResolvedValue(undefined);
	});

	it('returns rods, reels, lines, combos, reelCurrentLines', async () => {
		const result = await load();
		expect(result.rods).toEqual([]);
		expect(result.reels).toEqual([]);
		expect(result.lines).toEqual([]);
		expect(result.combos).toEqual([]);
		expect(result.reelCurrentLines).toEqual({});
	});

	it('attaches current line info for each reel that has a log entry', async () => {
		mockSelect.mockImplementation((col: any) => {
			// reels query returns one reel
			if (col === undefined || Object.keys(col ?? {}).length === 0 || col?.id) {
				return makeChain([{ id: 'reel-001', brand: 'Daiwa', model: 'Test', size: '2500' }]);
			}
			return makeChain([]);
		});
		mockFindFirstLog.mockResolvedValue({
			lineId: 'line-001',
			spooledAt: new Date('2025-01-01'),
			line: { brand: 'Sunline', model: 'FC Rock' },
		});

		const result = await load();
		expect(result.reelCurrentLines['reel-001']).toBeDefined();
		expect(result.reelCurrentLines['reel-001'].lineName).toBe('Sunline FC Rock');
	});

	it('sets lineName to null when log entry has no line', async () => {
		mockSelect.mockImplementationOnce(() => makeChain([])) // rods
			.mockImplementationOnce(() => makeChain([{ id: 'r1' }])) // reels
			.mockImplementationOnce(() => makeChain([])) // lines
		mockFindManyCombo.mockResolvedValue([]);
		mockFindFirstLog.mockResolvedValue({
			lineId: null,
			spooledAt: new Date(),
			line: null,
		});

		const result = await load();
		expect(result.reelCurrentLines['r1'].lineName).toBeNull();
	});
});
