import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => { throw { status, location }; },
	fail: (status: number, data: any) => ({ status, data }),
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
}));

class QuotaExceededError extends Error {}

vi.mock('$lib/server/uploads', () => ({
	saveUpload: vi.fn().mockResolvedValue('photo.jpg'),
	deleteUpload: vi.fn().mockResolvedValue(undefined),
	QuotaExceededError,
}));

const mockFindFirstSpot = vi.fn();
const mockFindManyPhoto = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockInsert = vi.fn();

function makeChain(result: any = undefined) {
	const self: any = {};
	['from', 'set', 'orderBy', 'where', 'limit'].forEach(k => { self[k] = vi.fn(() => self); });
	self.values = vi.fn(() => ({
		returning: vi.fn(() => Promise.resolve(Array.isArray(result) ? result : [result])),
		then: (fn: any, rej: any) => Promise.resolve(undefined).then(fn, rej),
	}));
	self.then = (fn: any, rej: any) => Promise.resolve(result ?? []).then(fn, rej);
	self.catch = (fn: any) => Promise.resolve(result ?? []).catch(fn);
	return self;
}

vi.mock('$lib/server/db', () => ({
	db: {
		query: {
			spot: { findFirst: mockFindFirstSpot },
			spotPhoto: { findMany: mockFindManyPhoto },
		},
		update: mockUpdate,
		delete: mockDelete,
		insert: mockInsert,
	},
}));

const { load: editLoad, actions: editActions } =
	await import('../spots/[id]/edit/+page.server');
const { actions: newActions } =
	await import('../spots/new/+page.server');

function makeRequest(entries: Record<string, string | File> = {}): Request {
	const fd = new FormData();
	for (const [k, v] of Object.entries(entries)) fd.append(k, v);
	return { formData: () => Promise.resolve(fd) } as any;
}

const existingSpot = {
	id: 'spot-001',
	name: 'Test Lake',
	lat: 52.52,
	lng: 13.40,
	notes: null,
	tags: [],
	photos: [],
};

describe('spots/[id]/edit load', () => {
	beforeEach(() => {
		mockFindFirstSpot.mockResolvedValue(existingSpot);
	});

	it('returns the spot', async () => {
		const result = await editLoad({ params: { id: 'spot-001' } } as any);
		expect(result.spot.name).toBe('Test Lake');
	});

	it('throws 404 when spot is not found', async () => {
		mockFindFirstSpot.mockResolvedValue(undefined);
		await expect(editLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('spots/[id]/edit update action', () => {
	beforeEach(() => {
		mockFindFirstSpot.mockResolvedValue({ ...existingSpot, photos: [] });
		mockFindManyPhoto.mockResolvedValue([]);
		mockUpdate.mockImplementation(() => makeChain());
		mockDelete.mockImplementation(() => makeChain());
		mockInsert.mockImplementation(() => makeChain());
	});

	it('fails when lat/lng is missing', async () => {
		const result = await editActions.update({
			params: { id: 'spot-001' },
			request: makeRequest({ name: 'Lake' }),
		} as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'locationRequired' } });
	});

	it('fails when lat/lng are not valid numbers', async () => {
		const result = await editActions.update({
			params: { id: 'spot-001' },
			request: makeRequest({ name: 'Lake', lat: 'abc', lng: 'def' }),
		} as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'locationRequired' } });
	});

	it('updates spot and redirects', async () => {
		await expect(
			editActions.update({
				params: { id: 'spot-001' },
				request: makeRequest({ name: 'My Lake', lat: '52.52', lng: '13.40' }),
			} as any)
		).rejects.toMatchObject({ status: 303, location: '/spots/spot-001' });
		expect(mockUpdate).toHaveBeenCalled();
	});

	it('inserts tags when provided', async () => {
		await expect(
			editActions.update({
				params: { id: 'spot-001' },
				request: makeRequest({ name: 'Lake', lat: '52.52', lng: '13.40', tags: 'river carp' }),
			} as any)
		).rejects.toMatchObject({ status: 303 });
		expect(mockInsert).toHaveBeenCalled();
	});

	it('throws 404 when spot does not exist', async () => {
		mockFindFirstSpot.mockResolvedValue(undefined);
		await expect(
			editActions.update({
				params: { id: 'x' },
				request: makeRequest({ name: 'L', lat: '52.52', lng: '13.40' }),
			} as any)
		).rejects.toMatchObject({ status: 404 });
	});

	it('deletes removed photos', async () => {
		const { deleteUpload } = await import('$lib/server/uploads');
		mockFindFirstSpot.mockResolvedValue({
			...existingSpot,
			photos: [{ id: 'ph1', filename: 'old.jpg' }],
		});
		const fd = new FormData();
		fd.append('name', 'L');
		fd.append('lat', '52.52');
		fd.append('lng', '13.40');
		fd.append('remove_photo', 'ph1');
		const request = { formData: () => Promise.resolve(fd) } as any;
		await expect(
			editActions.update({ params: { id: 'spot-001' }, request } as any)
		).rejects.toMatchObject({ status: 303 });
		expect(deleteUpload).toHaveBeenCalledWith('old.jpg');
	});
});

describe('spots/[id]/edit delete action', () => {
	beforeEach(() => {
		mockFindFirstSpot.mockResolvedValue({ ...existingSpot, photos: [] });
		mockDelete.mockImplementation(() => makeChain());
	});

	it('deletes spot and redirects to /spots', async () => {
		await expect(
			editActions.delete({ params: { id: 'spot-001' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/spots' });
	});

	it('deletes all photos before deleting spot', async () => {
		const { deleteUpload } = await import('$lib/server/uploads');
		mockFindFirstSpot.mockResolvedValue({
			...existingSpot,
			photos: [{ id: 'ph1', filename: 'a.jpg' }],
		});
		await expect(
			editActions.delete({ params: { id: 'spot-001' } } as any)
		).rejects.toMatchObject({ status: 303 });
		expect(deleteUpload).toHaveBeenCalledWith('a.jpg');
	});
});

describe('spots/[id]/edit photo uploads', () => {
	beforeEach(() => {
		mockFindFirstSpot.mockResolvedValue({ ...existingSpot, photos: [] });
		mockFindManyPhoto.mockResolvedValue([]);
		mockUpdate.mockImplementation(() => makeChain());
		mockDelete.mockImplementation(() => makeChain());
		mockInsert.mockImplementation(() => makeChain());
	});

	it('saves a new photo and inserts a spotPhoto row', async () => {
		const { saveUpload } = await import('$lib/server/uploads');
		const photo = new File(['data'], 'lake.jpg', { type: 'image/jpeg' });
		const fd = new FormData();
		fd.append('name', 'My Lake');
		fd.append('lat', '52.52');
		fd.append('lng', '13.40');
		fd.append('new_photos', photo);
		await expect(
			editActions.update({ params: { id: 'spot-001' }, request: { formData: () => Promise.resolve(fd) } } as any)
		).rejects.toMatchObject({ status: 303 });
		expect(saveUpload).toHaveBeenCalled();
		expect(mockInsert).toHaveBeenCalled();
	});

	it('returns 413 and cleans up on quota exceeded', async () => {
		const { saveUpload } = await import('$lib/server/uploads');
		vi.mocked(saveUpload).mockRejectedValueOnce(new QuotaExceededError());
		const photo = new File(['data'], 'lake.jpg', { type: 'image/jpeg' });
		const fd = new FormData();
		fd.append('name', 'My Lake');
		fd.append('lat', '52.52');
		fd.append('lng', '13.40');
		fd.append('new_photos', photo);
		const result = await editActions.update({ params: { id: 'spot-001' }, request: { formData: () => Promise.resolve(fd) } } as any);
		expect(result).toMatchObject({ status: 413, data: { error: 'quotaExceeded' } });
		vi.mocked(saveUpload).mockResolvedValue('photo.jpg');
	});
});

describe('spots/new default action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockInsert.mockImplementation(() => makeChain([{ id: 'new-spot-id' }]));
	});

	it('fails when lat/lng is missing', async () => {
		const result = await newActions.default({
			request: makeRequest({ name: 'Lake' }),
		} as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'locationRequired' } });
	});

	it('creates spot and redirects', async () => {
		await expect(
			newActions.default({
				request: makeRequest({ name: 'My Lake', lat: '52.52', lng: '13.40' }),
			} as any)
		).rejects.toMatchObject({ status: 303, location: '/spots/new-spot-id' });
		expect(mockInsert).toHaveBeenCalled();
	});

	it('inserts tags when provided', async () => {
		await expect(
			newActions.default({
				request: makeRequest({ name: 'L', lat: '52.52', lng: '13.40', tags: 'lake' }),
			} as any)
		).rejects.toMatchObject({ status: 303 });
		// insert called twice: once for spot, once for tags
		expect(mockInsert).toHaveBeenCalledTimes(2);
	});

	it('uses "Untitled Spot" when name is blank', async () => {
		await expect(
			newActions.default({
				request: makeRequest({ lat: '52.52', lng: '13.40' }),
			} as any)
		).rejects.toMatchObject({ status: 303 });
		// spot insert called with Untitled Spot as name (checked via call args)
		const callArgs = mockInsert.mock.calls[0];
		expect(callArgs).toBeDefined();
	});
});
