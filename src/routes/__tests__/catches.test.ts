import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => { throw { status, location }; },
	fail: (status: number, data: any) => ({ status, data }),
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
}));

vi.mock('$lib/server/uploads', () => ({
	saveUpload: vi.fn().mockResolvedValue('photo.jpg'),
	deleteUpload: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/server/biteIndex', () => ({
	fetchWeather: vi.fn().mockResolvedValue({ biteIndex: 7.5 }),
}));

const mockFindFirstCatch = vi.fn();
const mockFindManyPhoto = vi.fn();
const mockFindManyCombos = vi.fn();
const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockInsert = vi.fn();

function makeChain(result: any = undefined) {
	const self: any = {};
	['from', 'set', 'orderBy'].forEach(k => { self[k] = vi.fn(() => self); });
	self.where = vi.fn(() => Promise.resolve(result ?? []));
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
			fishCatch: { findFirst: mockFindFirstCatch },
			catchPhoto: { findMany: mockFindManyPhoto },
			combo: { findMany: mockFindManyCombos },
		},
		select: mockSelect,
		update: mockUpdate,
		delete: mockDelete,
		insert: mockInsert,
	},
}));

const { load: editLoad, actions: editActions } =
	await import('../catches/[id]/edit/+page.server');
const { load: newLoad, actions: newActions } =
	await import('../catches/new/+page.server');

function makeRequest(entries: Record<string, string | File> = {}): Request {
	const fd = new FormData();
	for (const [k, v] of Object.entries(entries)) fd.append(k, v);
	return { formData: () => Promise.resolve(fd) } as any;
}

const existingCatch = {
	id: 'catch-001',
	species: 'Pike',
	lat: 52.52,
	lng: 13.40,
	weightG: 1500,
	lengthCm: 55,
	photos: [],
	lure: null,
	combo: null,
};

describe('catches/[id]/edit load', () => {
	beforeEach(() => {
		mockFindFirstCatch.mockResolvedValue(existingCatch);
		mockFindManyCombos.mockResolvedValue([]);
		mockSelect.mockImplementation(() => makeChain([]));
	});

	it('returns the catch with lures and combos', async () => {
		const result = await editLoad({ params: { id: 'catch-001' } } as any);
		expect(result.catch.species).toBe('Pike');
		expect(result.lures).toEqual([]);
		expect(result.combos).toEqual([]);
	});

	it('throws 404 when catch is not found', async () => {
		mockFindFirstCatch.mockResolvedValue(undefined);
		await expect(editLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});
});

describe('catches/[id]/edit update action', () => {
	beforeEach(() => {
		mockFindFirstCatch.mockResolvedValue({ ...existingCatch, photos: [] });
		mockFindManyPhoto.mockResolvedValue([]);
		mockUpdate.mockImplementation(() => makeChain());
		mockDelete.mockImplementation(() => makeChain());
		mockInsert.mockImplementation(() => makeChain());
	});

	it('fails when species is missing', async () => {
		const result = await editActions.update({
			params: { id: 'catch-001' },
			request: makeRequest({ lat: '52.52', lng: '13.40' }),
		} as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'speciesRequired' } });
	});

	it('fails when lat/lng is missing', async () => {
		const result = await editActions.update({
			params: { id: 'catch-001' },
			request: makeRequest({ species: 'Pike' }),
		} as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'locationRequired' } });
	});

	it('updates catch and redirects', async () => {
		await expect(
			editActions.update({
				params: { id: 'catch-001' },
				request: makeRequest({ species: 'Pike', lat: '52.52', lng: '13.40' }),
			} as any)
		).rejects.toMatchObject({ status: 303, location: '/catches/catch-001' });
		expect(mockUpdate).toHaveBeenCalled();
	});

	it('throws 404 when catch does not exist', async () => {
		mockFindFirstCatch.mockResolvedValue(undefined);
		await expect(
			editActions.update({
				params: { id: 'x' },
				request: makeRequest({ species: 'Pike', lat: '52.52', lng: '13.40' }),
			} as any)
		).rejects.toMatchObject({ status: 404 });
	});

	it('deletes removed photos', async () => {
		const { deleteUpload } = await import('$lib/server/uploads');
		mockFindFirstCatch.mockResolvedValue({
			...existingCatch,
			photos: [{ id: 'ph1', filename: 'old.jpg' }],
		});
		const fd = new FormData();
		fd.append('species', 'Pike');
		fd.append('lat', '52.52');
		fd.append('lng', '13.40');
		fd.append('remove_photo', 'ph1');
		const request = { formData: () => Promise.resolve(fd) } as any;
		await expect(
			editActions.update({ params: { id: 'catch-001' }, request } as any)
		).rejects.toMatchObject({ status: 303 });
		expect(deleteUpload).toHaveBeenCalledWith('old.jpg');
	});
});

describe('catches/[id]/edit delete action', () => {
	beforeEach(() => {
		mockFindFirstCatch.mockResolvedValue({ ...existingCatch, photos: [] });
		mockDelete.mockImplementation(() => makeChain());
	});

	it('deletes catch and redirects to /catches', async () => {
		await expect(
			editActions.delete({ params: { id: 'catch-001' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/catches' });
	});

	it('deletes all photos before deleting catch', async () => {
		const { deleteUpload } = await import('$lib/server/uploads');
		mockFindFirstCatch.mockResolvedValue({
			...existingCatch,
			photos: [{ id: 'ph1', filename: 'a.jpg' }, { id: 'ph2', filename: 'b.jpg' }],
		});
		await expect(
			editActions.delete({ params: { id: 'catch-001' } } as any)
		).rejects.toMatchObject({ status: 303 });
		expect(deleteUpload).toHaveBeenCalledWith('a.jpg');
		expect(deleteUpload).toHaveBeenCalledWith('b.jpg');
	});
});

describe('catches/new load', () => {
	beforeEach(() => {
		mockSelect.mockImplementation(() => makeChain([]));
		mockFindManyCombos.mockResolvedValue([]);
	});

	it('returns lures and combos', async () => {
		const result = await newLoad();
		expect(result.lures).toEqual([]);
		expect(result.combos).toEqual([]);
	});
});

describe('catches/new default action', () => {
	beforeEach(() => {
		mockInsert.mockImplementation(() => makeChain([{ id: 'new-catch-id' }]));
	});

	it('fails when species is missing', async () => {
		const result = await newActions.default({
			request: makeRequest({ lat: '52.52', lng: '13.40' }),
		} as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'speciesRequired' } });
	});

	it('fails when location is missing', async () => {
		const result = await newActions.default({
			request: makeRequest({ species: 'Pike' }),
		} as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'locationRequired' } });
	});

	it('creates catch and redirects', async () => {
		await expect(
			newActions.default({
				request: makeRequest({ species: 'Pike', lat: '52.52', lng: '13.40' }),
			} as any)
		).rejects.toMatchObject({ status: 303, location: '/catches/new-catch-id' });
		expect(mockInsert).toHaveBeenCalled();
	});
});
