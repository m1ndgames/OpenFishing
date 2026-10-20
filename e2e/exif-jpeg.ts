// Builds a small JPEG carrying EXIF GPS + DateTimeOriginal, for the "location from photo"
// E2E tests (#37). The EXIF APP1 segment is hand-assembled (big-endian TIFF) because
// sharp can't write GPS rationals.
//
// The base image is a pre-encoded 16×16 JPEG rather than one rendered with sharp: importing
// sharp inside the Playwright runner crashes Node 22 ("Unexpected module status 3", a
// require-cycle bug in semver under Playwright's ESM loader hooks).
const BASE_JPEG = Buffer.from(
	'/9j/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAAQABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCcANSn/9k=',
	'base64'
);

type Entry = { tag: number; type: 2 | 4 | 5; count: number; data: Buffer };

const ASCII = 2, LONG = 4, RATIONAL = 5;

function ascii(tag: number, s: string): Entry {
	const data = Buffer.from(s + '\0', 'latin1');
	return { tag, type: ASCII, count: data.length, data };
}
function long(tag: number, v: number): Entry {
	const data = Buffer.alloc(4); data.writeUInt32BE(v, 0);
	return { tag, type: LONG, count: 1, data };
}
function rationals(tag: number, values: [number, number][]): Entry {
	const data = Buffer.alloc(values.length * 8);
	values.forEach(([n, d], i) => { data.writeUInt32BE(n, i * 8); data.writeUInt32BE(d, i * 8 + 4); });
	return { tag, type: RATIONAL, count: values.length, data };
}

/** Serialises one IFD at `offset` (relative to the TIFF header); values > 4 bytes go right after it. */
function ifd(entries: Entry[], offset: number): Buffer {
	const tableSize = 2 + entries.length * 12 + 4;
	const table = Buffer.alloc(tableSize);
	const extra: Buffer[] = [];
	let extraOffset = offset + tableSize;
	table.writeUInt16BE(entries.length, 0);
	entries.forEach((e, i) => {
		const p = 2 + i * 12;
		table.writeUInt16BE(e.tag, p);
		table.writeUInt16BE(e.type, p + 2);
		table.writeUInt32BE(e.count, p + 4);
		if (e.data.length <= 4) {
			e.data.copy(table, p + 8);
		} else {
			table.writeUInt32BE(extraOffset, p + 8);
			extra.push(e.data);
			extraOffset += e.data.length;
		}
	});
	return Buffer.concat([table, ...extra]); // next-IFD offset stays 0
}

function dms(deg: number): [number, number][] {
	const abs = Math.abs(deg);
	const d = Math.floor(abs);
	const m = Math.floor((abs - d) * 60);
	const s = Math.round(((abs - d) * 60 - m) * 60 * 100);
	return [[d, 1], [m, 1], [s, 100]];
}

export function buildGpsJpeg(lat: number, lng: number, takenAt: string): Buffer {
	const header = Buffer.from([0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8]); // "MM", 42, IFD0 at 8

	// IFD0 holds two pointers; its size is fixed (2 entries, no out-of-line data).
	const ifd0Size = 2 + 2 * 12 + 4;
	const exifOffset = 8 + ifd0Size;
	const exif = ifd([ascii(0x9003, takenAt)], exifOffset); // DateTimeOriginal "YYYY:MM:DD HH:MM:SS"
	const gpsOffset = exifOffset + exif.length;
	const gps = ifd([
		ascii(0x0001, lat >= 0 ? 'N' : 'S'),
		rationals(0x0002, dms(lat)),
		ascii(0x0003, lng >= 0 ? 'E' : 'W'),
		rationals(0x0004, dms(lng))
	], gpsOffset);
	const ifd0 = ifd([long(0x8769, exifOffset), long(0x8825, gpsOffset)], 8);

	const tiff = Buffer.concat([header, ifd0, exif, gps]);
	const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff]);
	const app1 = Buffer.alloc(4);
	app1.writeUInt16BE(0xffe1, 0);
	app1.writeUInt16BE(payload.length + 2, 2);

	// Splice the APP1 segment in right after the SOI marker (FFD8).
	return Buffer.concat([BASE_JPEG.subarray(0, 2), app1, payload, BASE_JPEG.subarray(2)]);
}
