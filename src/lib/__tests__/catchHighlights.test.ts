import { describe, it, expect } from 'vitest';
import { catchHighlights } from '../catchHighlights';

const cur = { id: 'a', lengthCm: 80, weightG: 4000 };

describe('catchHighlights', () => {
	it('no personal best when it is the only catch of the species', () => {
		expect(catchHighlights(cur, [{ ...cur }], null).personalBest).toBeNull();
		expect(catchHighlights(cur, [], null).personalBest).toBeNull();
	});

	it('personal best by length when longest', () => {
		const sibs = [{ ...cur }, { id: 'b', lengthCm: 60, weightG: 9000 }];
		expect(catchHighlights(cur, sibs, null).personalBest).toBe('length');
	});

	it('ties on length still count as best', () => {
		const sibs = [{ ...cur }, { id: 'b', lengthCm: 80, weightG: 100 }];
		expect(catchHighlights(cur, sibs, null).personalBest).toBe('length');
	});

	it('falls back to weight when not longest but heaviest', () => {
		const sibs = [{ ...cur }, { id: 'b', lengthCm: 90, weightG: 1000 }];
		expect(catchHighlights(cur, sibs, null).personalBest).toBe('weight');
	});

	it('no best when beaten on both', () => {
		const sibs = [{ ...cur }, { id: 'b', lengthCm: 90, weightG: 5000 }];
		expect(catchHighlights(cur, sibs, null).personalBest).toBeNull();
	});

	it('no best when the catch has no measurements', () => {
		const c = { id: 'a', lengthCm: null, weightG: null };
		expect(catchHighlights(c, [c, { id: 'b', lengthCm: null, weightG: null }], null).personalBest).toBeNull();
	});

	it('ignores unmeasured siblings', () => {
		const sibs = [{ ...cur }, { id: 'b', lengthCm: null, weightG: null }];
		expect(catchHighlights(cur, sibs, null).personalBest).toBe('length');
	});

	it('passes through a positive lure catch number, nulls otherwise', () => {
		expect(catchHighlights(cur, [], 3).lureCatchNumber).toBe(3);
		expect(catchHighlights(cur, [], 0).lureCatchNumber).toBeNull();
		expect(catchHighlights(cur, [], null).lureCatchNumber).toBeNull();
	});
});
