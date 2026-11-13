// Lure overview layout: the "box" (compartment grid) or a dense "list".
// Remembered per browser as a convenience. Storage can be missing or throw
// (private mode, blocked site data, SSR), so every access is guarded and
// falls back to the default.

export type LureView = 'box' | 'list';
export const LURE_VIEW_KEY = 'of-lure-view';

export function readLureView(storage: Pick<Storage, 'getItem'> | null | undefined = globalThis.localStorage): LureView {
	try {
		return storage?.getItem(LURE_VIEW_KEY) === 'list' ? 'list' : 'box';
	} catch {
		return 'box';
	}
}

export function writeLureView(view: LureView, storage: Pick<Storage, 'setItem'> | null | undefined = globalThis.localStorage): void {
	try {
		storage?.setItem(LURE_VIEW_KEY, view);
	} catch {
		/* not persisted: fine */
	}
}
