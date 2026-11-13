import { describe, it, expect } from 'vitest';
import { moonLitPath } from '../moonPhase';

describe('moonLitPath', () => {
	it('new moon has a zero-width lit area', () => {
		// limb right + terminator back along the same side with rx 8 → sliver of zero area
		expect(moonLitPath(0)).toBe('M10 2 A8 8 0 0 1 10 18 A8.000 8 0 0 0 10 2Z');
	});

	it('first quarter is the right half (straight terminator)', () => {
		// rx 0: the terminator is a straight line, so the sweep flag is irrelevant
		expect(moonLitPath(2)).toMatch(/^M10 2 A8 8 0 0 1 10 18 A0\.000 8 0 0 [01] 10 2Z$/);
	});

	it('full moon is a full disc (terminator bulges to the dark side)', () => {
		expect(moonLitPath(4)).toBe('M10 2 A8 8 0 0 0 10 18 A8.000 8 0 0 0 10 2Z');
	});

	it('waning crescent is lit on the left', () => {
		expect(moonLitPath(7)).toMatch(/^M10 2 A8 8 0 0 0 10 18 A5\.657 8 0 0 1 10 2Z$/);
	});

	it('wraps out-of-range indices', () => {
		expect(moonLitPath(8)).toBe(moonLitPath(0));
		expect(moonLitPath(-1)).toBe(moonLitPath(7));
	});
});
