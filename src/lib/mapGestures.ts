/**
 * Touch gestures for Leaflet maps that sit inside a scrolling page.
 *
 * On touch screens a one-finger drag scrolls the page instead of panning the
 * map (otherwise every map is a scroll trap on the long catch/spot forms), and
 * two fingers pan and zoom it. Leaflet supports this combination natively:
 * with `dragging` disabled the container gets `touch-action: pan-x pan-y`, so
 * the browser scrolls, while the pinch handler (`touchZoom`) pans the map along
 * with the midpoint of the two fingers. Taps still fire `click`, so
 * tap-to-place-marker keeps working.
 *
 * A one-finger drag over the map briefly shows a hint explaining the gesture.
 */

type MediaQuery = (query: string) => { matches: boolean };

/** True on devices whose primary pointer is touch. */
export function prefersTwoFingerMap(matchMedia: MediaQuery = (q) => window.matchMedia(q)): boolean {
	return matchMedia('(pointer: coarse)').matches;
}

/** The slice of the Leaflet map API this module uses. */
interface GestureMap {
	dragging: { disable(): void };
	on(type: 'unload', fn: () => void): void;
}

export const HINT_VISIBLE_CLASS = 'of-map-hint--on';
export const HINT_DURATION_MS = 1500;

/**
 * Switches a map to two-finger panning on touch devices and wires the hint.
 * Does nothing on mouse/trackpad devices. Cleans up when the map is removed.
 * Returns true when two-finger mode was enabled.
 */
export function setupMapGestures(
	map: GestureMap,
	container: HTMLElement,
	hintText: string,
	opts: { twoFinger?: boolean; durationMs?: number } = {}
): boolean {
	const twoFinger = opts.twoFinger ?? prefersTwoFingerMap();
	if (!twoFinger) return false;

	map.dragging.disable();

	const hint = container.ownerDocument.createElement('div');
	hint.className = 'of-map-hint';
	hint.textContent = hintText;
	// The hint only explains a gesture; it carries no information for screen readers.
	hint.setAttribute('aria-hidden', 'true');
	container.appendChild(hint);

	let timer: ReturnType<typeof setTimeout> | undefined;
	const hide = () => {
		clearTimeout(timer);
		hint.classList.remove(HINT_VISIBLE_CLASS);
	};
	const onTouchMove = (e: TouchEvent) => {
		if (e.touches.length !== 1) {
			hide();
			return;
		}
		hint.classList.add(HINT_VISIBLE_CLASS);
		clearTimeout(timer);
		timer = setTimeout(hide, opts.durationMs ?? HINT_DURATION_MS);
	};

	container.addEventListener('touchmove', onTouchMove, { passive: true });
	map.on('unload', () => {
		clearTimeout(timer);
		container.removeEventListener('touchmove', onTouchMove);
		hint.remove();
	});
	return true;
}
