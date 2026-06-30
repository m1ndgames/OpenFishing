import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEnv: Record<string, string | undefined> = { UPLOAD_PATH: './test-uploads' };

const writeFile = vi.fn(async () => undefined);
const mkdir = vi.fn(async () => undefined);
const unlink = vi.fn(async () => undefined);
const statSize = { size: 500 };
const stat = vi.fn(async () => statSize);

// Each db.select(...).from(...).where(...) resolves the next queued result.
let selectQueue: any[][] = [];

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('node:fs/promises', () => ({ writeFile, mkdir, unlink, stat }));
vi.mock('sharp', () => {
	const chain: any = {
		rotate: () => chain,
		resize: () => chain,
		jpeg: () => chain,
		toBuffer: async () => Buffer.alloc(1000) // every processed image is 1000 bytes
	};
	return { default: () => chain };
});
vi.mock('$lib/server/db', () => ({
	db: { select: () => ({ from: () => ({ where: async () => selectQueue.shift() ?? [] }) }) }
}));

const { saveUpload, deleteUpload, getUsedBytes, QuotaExceededError } = await import('../uploads');

function fakeFile(): File {
	return { arrayBuffer: async () => new ArrayBuffer(10) } as any;
}

beforeEach(() => {
	selectQueue = [];
	statSize.size = 500;
	writeFile.mockClear();
	unlink.mockClear();
	stat.mockClear();
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
	it('unlinks the file', async () => {
		await deleteUpload('photo.jpg');
		expect(unlink).toHaveBeenCalledOnce();
	});
});
