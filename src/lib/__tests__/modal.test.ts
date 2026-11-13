import { describe, it, expect } from 'vitest';
import { trapIndex } from '../modal';

describe('trapIndex', () => {
	it('lets the browser move focus between inner elements', () => {
		expect(trapIndex(0, 3, false)).toBeNull();
		expect(trapIndex(2, 3, true)).toBeNull();
	});

	it('wraps from the last element to the first on Tab', () => {
		expect(trapIndex(2, 3, false)).toBe(0);
	});

	it('wraps from the first element to the last on Shift+Tab', () => {
		expect(trapIndex(0, 3, true)).toBe(2);
	});

	it('pulls focus into the panel when it sits on the panel itself', () => {
		expect(trapIndex(-1, 3, false)).toBe(0);
		expect(trapIndex(-1, 3, true)).toBe(2);
	});

	it('keeps a single element focused', () => {
		expect(trapIndex(0, 1, false)).toBe(0);
		expect(trapIndex(0, 1, true)).toBe(0);
	});

	it('does nothing when nothing is focusable', () => {
		expect(trapIndex(-1, 0, false)).toBeNull();
	});
});
