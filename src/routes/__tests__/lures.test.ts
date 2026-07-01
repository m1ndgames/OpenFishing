import { describe, it, expect, vi, beforeEach } from 'vitest';

// Kit mock — redirect throws, fail/error return/throw
vi.mock('@sveltejs/kit', () => ({
	redirect: (status: number, location: string) => { throw { status, location }; },
	fail: (status: number, data: any) => ({ status, data }),
	error: (status: number, msg?: string) => { throw { status, message: msg }; },
}));

vi.mock('$lib/server/uploads', () => ({
	saveUpload: vi.fn().mockResolvedValue('photo-uuid.jpg'),
	deleteUpload: vi.fn().mockResolvedValue(undefined),
}));

const mockFindFirst = vi.fn();
const mockSelectDistinct = vi.fn();
const mockSelectSpecies = vi.fn();
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
			lure: { findFirst: mockFindFirst },
		},
		select: mockSelectSpecies,
		selectDistinct: mockSelectDistinct,
		update: mockUpdate,
		delete: mockDelete,
		insert: mockInsert,
	},
}));

const { load: editLoad, actions: editActions } =
	await import('../lures/[id]/edit/+page.server');
const { load: newLoad, actions: newActions } =
	await import('../lures/new/+page.server');

import { saveUpload, deleteUpload } from '$lib/server/uploads';

const existingLure = {
	id: 'lure-001',
	name: 'Silver Spinner',
	brand: 'Mepps',
	type: 'Spinner',
	color: 'Silver',
	weight: 7,
	species: 'Pike',
	photoPath: null,
	tags: [{ id: 't1', name: 'river' }],
};

function makeFormData(entries: Record<string, string | File | string[]> = {}): FormData {
	const fd = new FormData();
	for (const [k, v] of Object.entries(entries)) {
		if (Array.isArray(v)) {
			v.forEach(val => fd.append(k, val));
		} else {
			fd.append(k, v);
		}
	}
	return fd;
}

function makeRequest(entries: Record<string, string | File | string[]> = {}): Request {
	const fd = makeFormData(entries);
	return { formData: () => Promise.resolve(fd) } as any;
}

describe('lures/[id]/edit load', () => {
	beforeEach(() => {
		mockFindFirst.mockResolvedValue(existingLure);
		mockSelectDistinct.mockImplementation(() => makeChain([{ val: 'Spinner' }]));
		mockSelectSpecies.mockImplementation(() => makeChain([{ val: 'Pike' }]));
	});

	it('returns the lure with tags', async () => {
		const result = await editLoad({ params: { id: 'lure-001' } } as any);
		expect(result.lure.name).toBe('Silver Spinner');
		expect(result.lure.tags).toHaveLength(1);
	});

	it('throws 404 when lure not found', async () => {
		mockFindFirst.mockResolvedValue(undefined);
		await expect(editLoad({ params: { id: 'x' } } as any)).rejects.toMatchObject({ status: 404 });
	});

	it('returns suggestions with species', async () => {
		const result = await editLoad({ params: { id: 'lure-001' } } as any);
		expect(result.suggestions).toBeDefined();
	});
});

describe('lures/[id]/edit update action', () => {
	beforeEach(() => {
		mockFindFirst.mockResolvedValue(existingLure);
		mockUpdate.mockImplementation(() => makeChain());
		mockDelete.mockImplementation(() => makeChain());
		mockInsert.mockImplementation(() => makeChain());
	});

	it('fails with 400 when name is empty', async () => {
		const result = await editActions.update({
			params: { id: 'lure-001' },
			request: makeRequest({ name: '' }),
		} as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'nameRequired' } });
	});

	it('updates the lure and redirects', async () => {
		await expect(
			editActions.update({
				params: { id: 'lure-001' },
				request: makeRequest({ name: 'Updated Spinner', tags: '' }),
			} as any)
		).rejects.toMatchObject({ status: 303, location: '/lures/lure-001' });
		expect(mockUpdate).toHaveBeenCalled();
	});

	it('inserts tags when tags field is populated', async () => {
		await expect(
			editActions.update({
				params: { id: 'lure-001' },
				request: makeRequest({ name: 'My Lure', tags: 'river lake' }),
			} as any)
		).rejects.toMatchObject({ status: 303 });
		expect(mockInsert).toHaveBeenCalled();
	});

	it('clears photo when clear_photo=1', async () => {
		mockFindFirst.mockResolvedValue({ ...existingLure, photoPath: 'old.jpg' });
		await expect(
			editActions.update({
				params: { id: 'lure-001' },
				request: makeRequest({ name: 'X', clear_photo: '1' }),
			} as any)
		).rejects.toMatchObject({ status: 303 });
		expect(deleteUpload).toHaveBeenCalledWith('old.jpg');
	});

	it('saves new photo and replaces old one', async () => {
		mockFindFirst.mockResolvedValue({ ...existingLure, photoPath: 'old.jpg' });
		const file = new File(['data'], 'photo.jpg', { type: 'image/jpeg' });
		await expect(
			editActions.update({
				params: { id: 'lure-001' },
				request: makeRequest({ name: 'X', photo: file }),
			} as any)
		).rejects.toMatchObject({ status: 303 });
		expect(saveUpload).toHaveBeenCalledWith(file, undefined);
		expect(deleteUpload).toHaveBeenCalledWith('old.jpg');
	});

	it('throws 404 when lure does not exist', async () => {
		mockFindFirst.mockResolvedValue(undefined);
		await expect(
			editActions.update({
				params: { id: 'x' },
				request: makeRequest({ name: 'X' }),
			} as any)
		).rejects.toMatchObject({ status: 404 });
	});
});

describe('lures/[id]/edit delete action', () => {
	beforeEach(() => {
		mockFindFirst.mockResolvedValue(existingLure);
		mockDelete.mockImplementation(() => makeChain());
	});

	it('deletes lure and redirects to /', async () => {
		await expect(
			editActions.delete({ params: { id: 'lure-001' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/' });
		expect(mockDelete).toHaveBeenCalled();
	});

	it('deletes photo if one exists', async () => {
		mockFindFirst.mockResolvedValue({ ...existingLure, photoPath: 'photo.jpg' });
		await expect(
			editActions.delete({ params: { id: 'lure-001' } } as any)
		).rejects.toMatchObject({ status: 303 });
		expect(deleteUpload).toHaveBeenCalledWith('photo.jpg');
	});
});

describe('lures/[id]/edit markLost action', () => {
	beforeEach(() => {
		mockUpdate.mockImplementation(() => makeChain());
	});

	it('marks lure as lost and redirects', async () => {
		await expect(
			editActions.markLost({ params: { id: 'lure-001' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/lures/lure-001' });
		expect(mockUpdate).toHaveBeenCalled();
	});
});

describe('lures/[id]/edit markFound action', () => {
	beforeEach(() => {
		mockUpdate.mockImplementation(() => makeChain());
	});

	it('marks lure as found and redirects', async () => {
		await expect(
			editActions.markFound({ params: { id: 'lure-001' } } as any)
		).rejects.toMatchObject({ status: 303, location: '/lures/lure-001' });
		expect(mockUpdate).toHaveBeenCalled();
	});
});

describe('lures/new load', () => {
	beforeEach(() => {
		mockSelectDistinct.mockImplementation(() => makeChain([]));
		mockSelectSpecies.mockImplementation(() => makeChain([]));
	});

	it('returns suggestions object', async () => {
		const result = await newLoad({ locals: { user: null } } as any);
		expect(result.suggestions).toBeDefined();
		expect(result.suggestions.names).toBeDefined();
	});
});

describe('lures/new default action', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSelectSpecies.mockImplementation(() => makeChain([{ maxNum: 5 }]));
		mockInsert.mockImplementation(() => makeChain([{ id: 'new-lure-id', name: 'Test' }]));
	});

	it('fails when no photo is provided', async () => {
		const result = await newActions.default({
			request: makeRequest({ name: 'My Lure' }),
		} as any);
		expect(result).toMatchObject({ status: 400, data: { error: 'photoRequired' } });
	});

	it('creates lure with photo and redirects', async () => {
		const file = new File(['data'], 'lure.jpg', { type: 'image/jpeg' });
		await expect(
			newActions.default({
				request: makeRequest({ name: 'Test Lure', photo: file }),
			} as any)
		).rejects.toMatchObject({ status: 303, location: '/lures/new-lure-id' });
		expect(saveUpload).toHaveBeenCalledWith(file, undefined);
	});

	it('inserts tags when provided', async () => {
		const file = new File(['data'], 'lure.jpg', { type: 'image/jpeg' });
		await expect(
			newActions.default({
				request: makeRequest({ name: 'T', photo: file, tags: 'river' }),
			} as any)
		).rejects.toMatchObject({ status: 303 });
		// insert called for lure then for tags
		expect(mockInsert).toHaveBeenCalledTimes(2);
	});
});
