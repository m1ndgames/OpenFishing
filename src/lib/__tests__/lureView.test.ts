import { describe, it, expect } from 'vitest';
import { readLureView, writeLureView, LURE_VIEW_KEY } from '../lureView';

function memStore() {
	const m = new Map<string, string>();
	return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
}

describe('lureView', () => {
	it('defaults to box', () => {
		expect(readLureView(memStore())).toBe('box');
		expect(readLureView(null)).toBe('box');
	});

	it('round-trips list', () => {
		const s = memStore();
		writeLureView('list', s);
		expect(s.m.get(LURE_VIEW_KEY)).toBe('list');
		expect(readLureView(s)).toBe('list');
	});

	it('ignores unknown stored values', () => {
		const s = memStore();
		s.setItem(LURE_VIEW_KEY, 'weird');
		expect(readLureView(s)).toBe('box');
	});

	it('survives throwing storage', () => {
		const bad = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('denied'); } };
		expect(readLureView(bad)).toBe('box');
		expect(() => writeLureView('list', bad)).not.toThrow();
	});
});
