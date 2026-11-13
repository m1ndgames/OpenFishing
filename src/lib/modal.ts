// Keyboard behaviour for overlay panels (bite-info popup, crop window, chatbot):
// Escape closes, focus moves into the panel on open and back to the opener on
// close, and — for modal panels — Tab cycles inside the panel instead of
// wandering into the page behind the backdrop.

const FOCUSABLE = [
	'a[href]',
	'button:not([disabled])',
	'input:not([disabled]):not([type="hidden"])',
	'select:not([disabled])',
	'textarea:not([disabled])',
	'[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * Index to move focus to when Tab (or Shift+Tab) is pressed inside a trap of
 * `count` focusable elements, or null to let the browser handle it.
 * `current` is the index of the focused element, -1 when focus is elsewhere
 * in the panel (e.g. on the panel itself).
 */
export function trapIndex(current: number, count: number, shift: boolean): number | null {
	if (count === 0) return null;
	if (current === -1) return shift ? count - 1 : 0;
	if (shift && current === 0) return count - 1;
	if (!shift && current === count - 1) return 0;
	return null;
}

export interface ModalOptions {
	onClose: () => void;
	/** Trap Tab inside the panel (true for panels with a full-screen backdrop). */
	trap?: boolean;
	/** Element to focus on open; defaults to the first focusable, else the panel. */
	initialFocus?: string;
}

export function modal(node: HTMLElement, options: ModalOptions) {
	let opts = options;
	const opener = document.activeElement as HTMLElement | null;

	if (!node.hasAttribute('tabindex')) node.setAttribute('tabindex', '-1');
	const first = (opts.initialFocus && node.querySelector<HTMLElement>(opts.initialFocus))
		|| node.querySelector<HTMLElement>(FOCUSABLE)
		|| node;
	first.focus({ preventScroll: true });

	function onKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			e.preventDefault();
			opts.onClose();
			return;
		}
		if (e.key !== 'Tab' || !opts.trap) return;
		const items = [...node.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
		const next = trapIndex(items.indexOf(document.activeElement as HTMLElement), items.length, e.shiftKey);
		if (next !== null) {
			e.preventDefault();
			items[next].focus();
		}
	}

	// Listen on the document so Escape works even when focus sits on the backdrop.
	document.addEventListener('keydown', onKeydown);

	return {
		update(next: ModalOptions) { opts = next; },
		destroy() {
			document.removeEventListener('keydown', onKeydown);
			// Return focus to whatever opened the panel, if it's still on the page.
			if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
		}
	};
}
