import { describe, it, expect, vi, beforeEach } from 'vitest';

const readFile = vi.fn();
const getThumbnail = vi.fn();

vi.mock('node:fs/promises', () => ({ readFile }));
vi.mock('#lib/server/uploads.js', () => ({
	UPLOAD_DIR: './test-uploads',
	getThumbnail,
	isThumbWidth: (w: number) => [160, 320, 640, 1280].includes(w)
}));
vi.mock('@sveltejs/kit', () => ({
	error: (status: number) => { throw { status }; }
}));

const { GET } = await import('../uploads/[filename]/+server');

function call(filename: string, query = '') {
	return GET({ params: { filename }, url: new URL(`http://x/uploads/${filename}${query}`) } as never);
}

beforeEach(() => {
	readFile.mockReset();
	getThumbnail.mockReset();
	vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('GET /uploads/[filename]', () => {
	it('serves the original with its mime type and a long cache', async () => {
		readFile.mockResolvedValue(Buffer.from('jpeg'));
		const res = await call('abc.jpg');
		expect(res.headers.get('Content-Type')).toBe('image/jpeg');
		expect(res.headers.get('Cache-Control')).toContain('immutable');
		expect(getThumbnail).not.toHaveBeenCalled();
	});

	it('serves a WebP thumbnail for an allowed width', async () => {
		getThumbnail.mockResolvedValue(Buffer.from('webp'));
		const res = await call('abc.jpg', '?w=320');
		expect(getThumbnail).toHaveBeenCalledWith('abc.jpg', 320);
		expect(res.headers.get('Content-Type')).toBe('image/webp');
		expect(await res.text()).toBe('webp');
	});

	it('falls back to the original for an unknown width', async () => {
		readFile.mockResolvedValue(Buffer.from('jpeg'));
		const res = await call('abc.jpg', '?w=999');
		expect(getThumbnail).not.toHaveBeenCalled();
		expect(res.headers.get('Content-Type')).toBe('image/jpeg');
	});

	it('404s when the original behind a thumbnail is missing', async () => {
		getThumbnail.mockRejectedValue(new Error('ENOENT'));
		readFile.mockRejectedValue(new Error('ENOENT'));
		await expect(call('gone.jpg', '?w=160')).rejects.toEqual({ status: 404 });
	});

	it('serves the original when a thumbnail cannot be built, logging once', async () => {
		getThumbnail.mockRejectedValue(new Error('unsupported image format'));
		readFile.mockResolvedValue(Buffer.from('odd'));
		const log = vi.spyOn(console, 'error').mockImplementation(() => {});
		const res = await call('odd.jpg', '?w=320');
		expect(res.headers.get('Content-Type')).toBe('image/jpeg');
		expect(await res.text()).toBe('odd');
		await call('odd.jpg', '?w=640');
		expect(log.mock.calls.filter((c) => String(c[0]).includes('odd.jpg'))).toHaveLength(1);
	});

	it('404s when the original is missing', async () => {
		readFile.mockRejectedValue(new Error('ENOENT'));
		await expect(call('gone.jpg')).rejects.toEqual({ status: 404 });
	});

	it.each(['../secret.jpg', 'a\\b.jpg', '.thumbs'])('rejects path tricks: %s', async (name) => {
		await expect(call(name)).rejects.toEqual({ status: 400 });
		expect(readFile).not.toHaveBeenCalled();
	});
});
