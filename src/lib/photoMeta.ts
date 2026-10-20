/** Location + capture time read from a photo's EXIF data (#37). Any field may be null. */
export type PhotoMeta = { lat: number | null; lng: number | null; takenAt: Date | null };

const EMPTY: PhotoMeta = { lat: null, lng: null, takenAt: null };

function validCoords(lat: unknown, lng: unknown): lat is number {
	if (typeof lat !== 'number' || typeof lng !== 'number') return false;
	if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
	if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return false;
	// Some cameras write 0/0 when they had no GPS fix
	return !(lat === 0 && lng === 0);
}

function validDate(d: unknown): d is Date {
	return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Reads GPS coordinates and the capture time (DateTimeOriginal, falling back to CreateDate)
 * from a photo in the browser. exifr is loaded lazily so it only ships once a photo is picked.
 * Never throws — unreadable or metadata-less photos yield all-null fields.
 */
export async function readPhotoMeta(file: File): Promise<PhotoMeta> {
	try {
		const exifr = (await import('exifr/dist/lite.esm.mjs')).default;
		const tags = await exifr.parse(file);
		if (!tags) return EMPTY;
		const hasCoords = validCoords(tags.latitude, tags.longitude);
		const takenAt = [tags.DateTimeOriginal, tags.CreateDate].find(validDate) ?? null;
		return {
			lat: hasCoords ? tags.latitude : null,
			lng: hasCoords ? tags.longitude : null,
			takenAt
		};
	} catch {
		return EMPTY;
	}
}

/** Formats a Date as a `datetime-local` input value (`YYYY-MM-DDTHH:mm`) in local time. */
export function toDatetimeLocal(d: Date): string {
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
