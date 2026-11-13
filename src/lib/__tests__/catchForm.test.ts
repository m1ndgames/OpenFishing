import { describe, it, expect } from 'vitest';
import { lureLabel, lurePlate, rankQuickLures, sortByUsage, type PickerLure } from '../catchForm';

const lure = (id: string, n: number, o: Partial<PickerLure> = {}): PickerLure => ({
	id, lureNumber: n, name: `Lure ${n}`, photoPath: null, favourite: false, lost: false, ...o
});

describe('lureLabel / lurePlate', () => {
	it('pads the lure number to four digits', () => {
		expect(lureLabel({ lureNumber: 7, name: 'Spinner' })).toBe('#0007 Spinner');
		expect(lurePlate(42)).toBe('#0042');
	});

	it('omits the plate for lures without a number', () => {
		expect(lureLabel({ lureNumber: null, name: 'Spinner' })).toBe('Spinner');
		expect(lurePlate(null)).toBe('');
	});
});

describe('rankQuickLures', () => {
	const lures = [lure('a', 1), lure('b', 2, { favourite: true }), lure('c', 3), lure('d', 4, { favourite: true, lost: true })];

	it('puts recently used lures first, in order of use, without duplicates', () => {
		expect(rankQuickLures(lures, ['c', 'a', 'c']).map((l) => l.id)).toEqual(['c', 'a', 'b']);
	});

	it('fills up with favourites and never offers lost lures', () => {
		expect(rankQuickLures(lures, []).map((l) => l.id)).toEqual(['b']);
		expect(rankQuickLures(lures, ['d']).map((l) => l.id)).toEqual(['b']);
	});

	it('ignores null and unknown ids and respects the limit', () => {
		expect(rankQuickLures(lures, [null, 'zzz', 'a', 'c'], 1).map((l) => l.id)).toEqual(['a']);
	});
});

describe('sortByUsage', () => {
	it('orders by count, most used first, keeping the original order for ties', () => {
		expect(sortByUsage(['A', 'B', 'C', 'D'], { C: 5, B: 1, D: 1 })).toEqual(['C', 'B', 'D', 'A']);
	});

	it('leaves the order untouched without counts', () => {
		expect(sortByUsage(['A', 'B'], {})).toEqual(['A', 'B']);
	});
});
