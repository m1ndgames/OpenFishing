// URLs for uploaded photos. `/uploads/<file>?w=N` serves a cached WebP thumbnail
// (see THUMB_WIDTHS in src/lib/server/uploads.ts); without `w` you get the original.

/** Small square-ish previews: list rows, catch rows, lure picker tiles (≤ 80 CSS px). */
export const THUMB_SMALL = 160;

export function photoUrl(filename: string, width?: 160 | 320 | 640 | 1280): string {
	const base = `/uploads/${encodeURIComponent(filename)}`;
	return width ? `${base}?w=${width}` : base;
}

/** srcset for the lure grid cards (2 → 3 → 4 columns, ~170–290 CSS px wide). */
export function gridSrcset(filename: string): string {
	return `${photoUrl(filename, 320)} 320w, ${photoUrl(filename, 640)} 640w`;
}

/** `sizes` matching `.of-lure-grid`: 2 columns on phones, 3 from 768px, 4 (max ~290px) from 1280px. */
export const GRID_SIZES = '(min-width: 1280px) 290px, (min-width: 768px) 33vw, 50vw';

/**
 * srcset for the photo a detail or share page is about. The original (≤ 1920px) stays the
 * largest candidate, so big screens still get full resolution; phones take 640/1280 WebP.
 */
export function detailSrcset(filename: string): string {
	return `${photoUrl(filename, 640)} 640w, ${photoUrl(filename, 1280)} 1280w, ${photoUrl(filename)} 1920w`;
}

/** `sizes` for detail/share hero photos: full width on phones, the ~500px column from 960px. */
export const DETAIL_SIZES = '(min-width: 960px) 520px, 100vw';

type PhotoAltStrings = { photoAlt: string; photoAltPlain: string };

/** Translated alt text for photo `index` (0-based) of `total` in a carousel. */
export function photoAlt(t: PhotoAltStrings, subject: string | null | undefined, index: number, total: number): string {
	const template = subject ? t.photoAlt : t.photoAltPlain;
	return template
		.replace('{subject}', subject ?? '')
		.replace('{n}', String(index + 1))
		.replace('{total}', String(total));
}

/** `sizes` for the /catches cards (auto-fill, min 280px: one full-width column on phones). */
export const CARD_SIZES = '(min-width: 640px) 360px, 100vw';
