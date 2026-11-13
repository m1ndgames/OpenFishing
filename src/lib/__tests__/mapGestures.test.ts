import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	prefersTwoFingerMap,
	setupMapGestures,
	HINT_VISIBLE_CLASS,
	HINT_DURATION_MS
} from '../mapGestures';

type TouchHandler = (e: { touches: { length: number } }) => void;

function makeFakes() {
	const classes = new Set<string>();
	const hint = {
		className: '',
		textContent: null as string | null,
		attrs: {} as Record<string, string>,
		removed: false,
		classList: { add: (c: string) => classes.add(c), remove: (c: string) => classes.delete(c) },
		setAttribute(name: string, value: string) { this.attrs[name] = value; },
		remove() { this.removed = true; }
	};
	let handler: TouchHandler | null = null;
	let listenerOpts: AddEventListenerOptions | undefined;
	const container = {
		children: [] as unknown[],
		ownerDocument: { createElement: vi.fn(() => hint) },
		appendChild(el: unknown) { this.children.push(el); },
		addEventListener: vi.fn((_t: 'touchmove', fn: TouchHandler, opts: AddEventListenerOptions) => {
			handler = fn;
			listenerOpts = opts;
		}),
		removeEventListener: vi.fn((_t: 'touchmove', fn: TouchHandler) => {
			if (handler === fn) handler = null;
		})
	};
	let unload: (() => void) | null = null;
	const map = {
		dragging: { disable: vi.fn() },
		on: vi.fn((_t: 'unload', fn: () => void) => { unload = fn; })
	};
	return {
		hint, classes, map,
		// The fake implements only what setupMapGestures touches.
		container: container as unknown as HTMLElement & typeof container,
		touch: (fingers: number) => handler?.({ touches: { length: fingers } }),
		hasListener: () => handler !== null,
		listenerOpts: () => listenerOpts,
		unload: () => unload?.()
	};
}

describe('prefersTwoFingerMap', () => {
	it('is true when the primary pointer is coarse', () => {
		const mq = vi.fn((q: string) => ({ matches: q === '(pointer: coarse)' }));
		expect(prefersTwoFingerMap(mq)).toBe(true);
		expect(mq).toHaveBeenCalledWith('(pointer: coarse)');
	});

	it('is false for mouse and trackpad devices', () => {
		expect(prefersTwoFingerMap(() => ({ matches: false }))).toBe(false);
	});
});

describe('setupMapGestures', () => {
	beforeEach(() => { vi.useFakeTimers(); });
	afterEach(() => { vi.useRealTimers(); });

	it('leaves the map untouched on non-touch devices', () => {
		const f = makeFakes();
		expect(setupMapGestures(f.map, f.container, 'hint', { twoFinger: false })).toBe(false);
		expect(f.map.dragging.disable).not.toHaveBeenCalled();
		expect(f.container.children).toHaveLength(0);
		expect(f.container.addEventListener).not.toHaveBeenCalled();
	});

	it('disables one-finger dragging and adds a hidden, aria-hidden hint', () => {
		const f = makeFakes();
		expect(setupMapGestures(f.map, f.container, 'Use two fingers', { twoFinger: true })).toBe(true);
		expect(f.map.dragging.disable).toHaveBeenCalledOnce();
		expect(f.container.children).toEqual([f.hint]);
		expect(f.hint.className).toBe('of-map-hint');
		expect(f.hint.textContent).toBe('Use two fingers');
		expect(f.hint.attrs['aria-hidden']).toBe('true');
		expect(f.classes.has(HINT_VISIBLE_CLASS)).toBe(false);
	});

	it('registers a passive touchmove listener so page scrolling is never blocked', () => {
		const f = makeFakes();
		setupMapGestures(f.map, f.container, 'hint', { twoFinger: true });
		expect(f.listenerOpts()).toEqual({ passive: true });
	});

	it('shows the hint on a one-finger drag and hides it after the duration', () => {
		const f = makeFakes();
		setupMapGestures(f.map, f.container, 'hint', { twoFinger: true });
		f.touch(1);
		expect(f.classes.has(HINT_VISIBLE_CLASS)).toBe(true);
		vi.advanceTimersByTime(HINT_DURATION_MS - 1);
		expect(f.classes.has(HINT_VISIBLE_CLASS)).toBe(true);
		vi.advanceTimersByTime(1);
		expect(f.classes.has(HINT_VISIBLE_CLASS)).toBe(false);
	});

	it('keeps the hint up while the one-finger drag continues', () => {
		const f = makeFakes();
		setupMapGestures(f.map, f.container, 'hint', { twoFinger: true, durationMs: 1000 });
		f.touch(1);
		vi.advanceTimersByTime(800);
		f.touch(1);
		vi.advanceTimersByTime(800);
		expect(f.classes.has(HINT_VISIBLE_CLASS)).toBe(true);
		vi.advanceTimersByTime(200);
		expect(f.classes.has(HINT_VISIBLE_CLASS)).toBe(false);
	});

	it('hides the hint as soon as a second finger joins (the user is panning)', () => {
		const f = makeFakes();
		setupMapGestures(f.map, f.container, 'hint', { twoFinger: true });
		f.touch(1);
		f.touch(2);
		expect(f.classes.has(HINT_VISIBLE_CLASS)).toBe(false);
	});

	it('never shows the hint for two-finger gestures', () => {
		const f = makeFakes();
		setupMapGestures(f.map, f.container, 'hint', { twoFinger: true });
		f.touch(2);
		expect(f.classes.has(HINT_VISIBLE_CLASS)).toBe(false);
	});

	it('removes the listener, timer and hint when the map unloads', () => {
		const f = makeFakes();
		setupMapGestures(f.map, f.container, 'hint', { twoFinger: true });
		f.touch(1);
		f.unload();
		expect(f.hasListener()).toBe(false);
		expect(f.hint.removed).toBe(true);
		// A pending hide timer must not fire against the removed hint.
		expect(vi.getTimerCount()).toBe(0);
	});
});
