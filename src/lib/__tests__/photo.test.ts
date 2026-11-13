import { describe, it, expect } from 'vitest';
import { photoUrl, gridSrcset, THUMB_SMALL } from '../photo';

describe('photoUrl', () => {
	it('points at the original without a width', () => {
		expect(photoUrl('abc.jpg')).toBe('/uploads/abc.jpg');
	});

	it('asks for a thumbnail with a width', () => {
		expect(photoUrl('abc.jpg', THUMB_SMALL)).toBe('/uploads/abc.jpg?w=160');
	});

	it('escapes odd filenames', () => {
		expect(photoUrl('a b#c.jpg', 320)).toBe('/uploads/a%20b%23c.jpg?w=320');
	});
});

describe('gridSrcset', () => {
	it('offers the 320 and 640 thumbnails', () => {
		expect(gridSrcset('abc.jpg')).toBe('/uploads/abc.jpg?w=320 320w, /uploads/abc.jpg?w=640 640w');
	});
});

describe('detailSrcset', () => {
	it('offers 640 and 1280 thumbnails and the original as the largest candidate', async () => {
		const { detailSrcset } = await import('../photo');
		expect(detailSrcset('p.jpg')).toBe('/uploads/p.jpg?w=640 640w, /uploads/p.jpg?w=1280 1280w, /uploads/p.jpg 1920w');
	});
});

describe('photoAlt', () => {
	const t = { photoAlt: '{subject}, Foto {n} von {total}', photoAltPlain: 'Foto {n} von {total}' };

	it('names the subject and position', async () => {
		const { photoAlt } = await import('../photo');
		expect(photoAlt(t, 'Hecht', 0, 3)).toBe('Hecht, Foto 1 von 3');
	});

	it('drops the subject when there is none', async () => {
		const { photoAlt } = await import('../photo');
		expect(photoAlt(t, null, 1, 2)).toBe('Foto 2 von 2');
	});
});
