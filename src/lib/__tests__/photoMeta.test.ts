import { describe, it, expect, vi, beforeEach } from 'vitest';

const parse = vi.fn();
vi.mock('exifr/dist/lite.esm.mjs', () => ({ default: { parse } }));

const { readPhotoMeta, toDatetimeLocal } = await import('../photoMeta');

const file = new File([new Uint8Array([0xff, 0xd8])], 'catch.jpg', { type: 'image/jpeg' });

beforeEach(() => {
	parse.mockReset();
});

describe('readPhotoMeta', () => {
	it('returns GPS coordinates and DateTimeOriginal', async () => {
		const taken = new Date(2026, 5, 15, 7, 30);
		parse.mockResolvedValue({ latitude: 52.52, longitude: 13.405, DateTimeOriginal: taken });
		expect(await readPhotoMeta(file)).toEqual({ lat: 52.52, lng: 13.405, takenAt: taken });
		expect(parse).toHaveBeenCalledWith(file);
	});

	it('falls back to CreateDate when DateTimeOriginal is missing', async () => {
		const created = new Date(2026, 0, 2, 3, 4);
		parse.mockResolvedValue({ CreateDate: created });
		expect(await readPhotoMeta(file)).toEqual({ lat: null, lng: null, takenAt: created });
	});

	it('ignores an invalid DateTimeOriginal and uses CreateDate', async () => {
		const created = new Date(2026, 0, 2, 3, 4);
		parse.mockResolvedValue({ DateTimeOriginal: new Date('nope'), CreateDate: created });
		expect((await readPhotoMeta(file)).takenAt).toBe(created);
	});

	it('returns null coordinates when the photo has no GPS', async () => {
		parse.mockResolvedValue({ Make: 'Canon' });
		expect(await readPhotoMeta(file)).toEqual({ lat: null, lng: null, takenAt: null });
	});

	it('rejects 0,0 (no GPS fix)', async () => {
		parse.mockResolvedValue({ latitude: 0, longitude: 0 });
		expect(await readPhotoMeta(file)).toMatchObject({ lat: null, lng: null });
	});

	it('rejects out-of-range and non-numeric coordinates', async () => {
		parse.mockResolvedValueOnce({ latitude: 95, longitude: 10 });
		expect(await readPhotoMeta(file)).toMatchObject({ lat: null, lng: null });
		parse.mockResolvedValueOnce({ latitude: 50, longitude: -181 });
		expect(await readPhotoMeta(file)).toMatchObject({ lat: null, lng: null });
		parse.mockResolvedValueOnce({ latitude: '50', longitude: 10 });
		expect(await readPhotoMeta(file)).toMatchObject({ lat: null, lng: null });
		parse.mockResolvedValueOnce({ latitude: NaN, longitude: 10 });
		expect(await readPhotoMeta(file)).toMatchObject({ lat: null, lng: null });
	});

	it('accepts southern/western coordinates', async () => {
		parse.mockResolvedValue({ latitude: -33.86, longitude: -70.5 });
		expect(await readPhotoMeta(file)).toMatchObject({ lat: -33.86, lng: -70.5 });
	});

	it('returns all nulls when the photo has no EXIF at all', async () => {
		parse.mockResolvedValue(undefined);
		expect(await readPhotoMeta(file)).toEqual({ lat: null, lng: null, takenAt: null });
	});

	it('never throws when exifr fails', async () => {
		parse.mockRejectedValue(new Error('Unknown file format'));
		expect(await readPhotoMeta(file)).toEqual({ lat: null, lng: null, takenAt: null });
	});
});

describe('readPhotoMeta with the real exifr lite bundle', () => {
	it('reads GPS + DateTimeOriginal from a real EXIF segment', async () => {
		const real = (await vi.importActual<any>('exifr/dist/lite.esm.mjs')).default;
		parse.mockImplementation((f: File) => f.arrayBuffer().then((b) => real.parse(b)));
		const meta = await readPhotoMeta(new File([exifJpeg()], 'gps.jpg', { type: 'image/jpeg' }));
		expect(meta.lat).toBeCloseTo(52.52, 4);
		expect(meta.lng).toBeCloseTo(13.405, 4);
		expect(meta.takenAt && toDatetimeLocal(meta.takenAt)).toBe('2026-06-15T07:30');
	});
});

describe('toDatetimeLocal', () => {
	it('formats a local date as YYYY-MM-DDTHH:mm with zero padding', () => {
		expect(toDatetimeLocal(new Date(2026, 0, 5, 7, 3, 59))).toBe('2026-01-05T07:03');
		expect(toDatetimeLocal(new Date(2026, 11, 31, 23, 59))).toBe('2026-12-31T23:59');
	});
});

/** Minimal JPEG (SOI + EXIF APP1 + EOI): GPS 52°31'12"N 13°24'18"E, DateTimeOriginal 2026:06:15 07:30:00. */
function exifJpeg(): Uint8Array {
	const bytes: number[] = [];
	const u16 = (v: number) => bytes.push((v >> 8) & 0xff, v & 0xff);
	const u32 = (v: number) => { u16(v >>> 16); u16(v & 0xffff); };
	const str = (s: string) => { for (const c of s) bytes.push(c.charCodeAt(0)); };

	// TIFF header + IFD0 (offset 8): ExifIFD → 38, GPS IFD → 76
	str('MM'); u16(42); u32(8);
	u16(2);
	u16(0x8769); u16(4); u32(1); u32(38);
	u16(0x8825); u16(4); u32(1); u32(76);
	u32(0);
	// Exif IFD (38): DateTimeOriginal (ASCII, 20 bytes at 56)
	u16(1); u16(0x9003); u16(2); u32(20); u32(56); u32(0);
	str('2026:06:15 07:30:00\0');
	// GPS IFD (76): refs inline, rationals at 130 and 154
	u16(4);
	u16(1); u16(2); u32(2); str('N\0\0\0');
	u16(2); u16(5); u32(3); u32(130);
	u16(3); u16(2); u32(2); str('E\0\0\0');
	u16(4); u16(5); u32(3); u32(154);
	u32(0);
	for (const [n, d] of [[52, 1], [31, 1], [12, 1], [13, 1], [24, 1], [18, 1]]) { u32(n); u32(d); }

	const tiff = bytes.splice(0);
	str('Exif\0\0');
	const payload = [...bytes, ...tiff];
	return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, ((payload.length + 2) >> 8) & 0xff, (payload.length + 2) & 0xff, ...payload, 0xff, 0xd9]);
}
