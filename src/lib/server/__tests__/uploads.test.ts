import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEnv: Record<string, string | undefined> = { UPLOAD_PATH: './test-uploads' };

const writeFile = vi.fn(async () => undefined);
const mkdir = vi.fn(async () => undefined);
const unlink = vi.fn(async () => undefined);
const statSize = { size: 500 };
const stat = vi.fn(async () => statSize);
const readFile = vi.fn(async (_p: string): Promise<Buffer> => { throw new Error('ENOENT'); });
const rename = vi.fn(async () => undefined);
const sharpCalls: { resize?: unknown[]; webp?: unknown } = {};

// Each db.select(...).from(...).where(...) resolves the next queued result.
let selectQueue: any[][] = [];

vi.mock('#lib/server/env.js', () => ({ env: mockEnv }));
vi.mock('node:fs/promises', () => ({ writeFile, mkdir, unlink, stat, readFile, rename }));
vi.mock('sharp', () => {
	const chain: any = {
		rotate: () => chain,
		resize: (...a: unknown[]) => { sharpCalls.resize = a; return chain; },
		jpeg: () => chain,
		webp: (o: unknown) => { sharpCalls.webp = o; return chain; },
		toBuffer: async () => Buffer.alloc(1000) // every processed image is 1000 bytes
	};
	return { default: () => chain };
});
vi.mock('#lib/server/db/index.js', () => ({
	db: { select: () => ({ from: () => ({ where: async () => selectQueue.shift() ?? [] }) }) }
}));

const { saveUpload, deleteUpload, getUsedBytes, QuotaExceededError, getThumbnail, thumbPath, isThumbWidth } = await import('../uploads');

function fakeFile(): File {
	return { arrayBuffer: async () => new ArrayBuffer(10) } as any;
}

beforeEach(() => {
	selectQueue = [];
	statSize.size = 500;
	writeFile.mockClear();
	unlink.mockClear();
	stat.mockClear();
	readFile.mockReset();
	readFile.mockImplementation(async () => { throw new Error('ENOENT'); });
	rename.mockClear();
	delete sharpCalls.resize;
	delete sharpCalls.webp;
});

describe('getUsedBytes', () => {
	it('sums the sizes of the user\'s photo files on disk', async () => {
		// lure photos, then spotIds (empty), then catchIds (empty)
		selectQueue = [[{ f: 'a.jpg' }, { f: 'b.jpg' }], [], []];
		expect(await getUsedBytes('u1')).toBe(1000); // 2 files × 500
	});

	it('skips null photo paths and missing files', async () => {
		selectQueue = [[{ f: 'a.jpg' }, { f: null }], [], []]; // null filtered out
		stat.mockImplementationOnce(async () => { throw new Error('missing'); }); // a.jpg not on disk
		expect(await getUsedBytes('u1')).toBe(0);
	});
});

describe('saveUpload quota', () => {
	it('writes the file when under quota', async () => {
		selectQueue = [[{ f: 'a.jpg' }], [], []]; // used = 500
		const name = await saveUpload(fakeFile(), { id: 'u1', quotaBytes: 5000 });
		expect(name).toMatch(/\.jpg$/);
		expect(writeFile).toHaveBeenCalledOnce();
	});

	it('throws QuotaExceededError and does not write when over quota', async () => {
		selectQueue = [[{ f: 'a.jpg' }, { f: 'b.jpg' }], [], []]; // used = 1000; + 1000 > 1500
		await expect(saveUpload(fakeFile(), { id: 'u1', quotaBytes: 1500 })).rejects.toBeInstanceOf(QuotaExceededError);
		expect(writeFile).not.toHaveBeenCalled();
	});

	it('allows unlimited quota (quotaBytes null) without checking usage', async () => {
		await saveUpload(fakeFile(), { id: 'u1', quotaBytes: null });
		expect(writeFile).toHaveBeenCalledOnce();
		expect(stat).not.toHaveBeenCalled(); // no usage computation needed
	});

	it('writes without an owner (open mode)', async () => {
		await saveUpload(fakeFile(), null);
		expect(writeFile).toHaveBeenCalledOnce();
		expect(stat).not.toHaveBeenCalled();
	});
});

describe('deleteUpload', () => {
	it('unlinks the file and its cached thumbnails', async () => {
		await deleteUpload('photo.jpg');
		const paths = unlink.mock.calls.map((c) => String((c as unknown[])[0]).replace(/\\/g, '/'));
		expect(paths).toHaveLength(5);
		expect(paths[0]).toMatch(/test-uploads\/photo\.jpg$/);
		expect(paths.slice(1)).toEqual([160, 320, 640, 1280].map((w) => expect.stringMatching(new RegExp(`\\.thumbs/photo-${w}\\.webp$`))));
	});

	it('ignores thumbnails that were never generated', async () => {
		unlink.mockImplementationOnce(async () => undefined).mockImplementation(async () => { throw new Error('ENOENT'); });
		await expect(deleteUpload('photo.jpg')).resolves.toBeUndefined();
		unlink.mockImplementation(async () => undefined);
	});
});

describe('thumbnails', () => {
	it('only accepts the advertised widths', () => {
		expect(isThumbWidth(160)).toBe(true);
		expect(isThumbWidth(640)).toBe(true);
		expect(isThumbWidth(1280)).toBe(true);
		expect(isThumbWidth(500)).toBe(false);
		expect(isThumbWidth(0)).toBe(false);
	});

	it('names the cached file after the original and the width', () => {
		expect(thumbPath('abc.jpg', 320).replace(/\\/g, '/')).toMatch(/test-uploads\/\.thumbs\/abc-320\.webp$/);
	});

	it('serves a cached thumbnail without re-encoding', async () => {
		readFile.mockImplementationOnce(async () => Buffer.from('cached'));
		const buf = await getThumbnail('abc.jpg', 160);
		expect(buf.toString()).toBe('cached');
		expect(sharpCalls.resize).toBeUndefined();
		expect(writeFile).not.toHaveBeenCalled();
	});

	it('builds, caches and returns a WebP on first request', async () => {
		readFile
			.mockImplementationOnce(async () => { throw new Error('ENOENT'); }) // no cache yet
			.mockImplementationOnce(async () => Buffer.from('original'));
		const buf = await getThumbnail('abc.jpg', 640);
		expect(buf.length).toBe(1000);
		expect(sharpCalls.resize).toEqual([640, 640, { fit: 'inside', withoutEnlargement: true }]);
		expect(sharpCalls.webp).toEqual({ quality: 75 });
		// written to a temp file, then renamed into place
		expect(writeFile).toHaveBeenCalledOnce();
		const tmp = String((writeFile.mock.calls[0] as unknown[])[0]);
		expect(rename).toHaveBeenCalledWith(tmp, thumbPath('abc.jpg', 640));
	});

	it('still returns the thumbnail when the cache dir is not writable', async () => {
		readFile
			.mockImplementationOnce(async () => { throw new Error('ENOENT'); })
			.mockImplementationOnce(async () => Buffer.from('original'));
		writeFile.mockImplementationOnce(async () => { throw new Error('EACCES'); });
		const err = vi.spyOn(console, 'error').mockImplementation(() => {});
		expect((await getThumbnail('abc.jpg', 320)).length).toBe(1000);
		err.mockRestore();
	});

	it('throws when the original is missing', async () => {
		await expect(getThumbnail('missing.jpg', 160)).rejects.toThrow();
	});
});
