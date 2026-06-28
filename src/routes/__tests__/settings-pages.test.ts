import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
	fail: (status: number, data: any) => ({ status, data }),
}));

vi.mock('qrcode', () => ({
	default: { toString: vi.fn().mockResolvedValue('<svg>qr</svg>') },
}));

vi.mock('$lib/server/db/schema-hash', () => ({
	getSchemaHash: vi.fn().mockReturnValue('abc123def456'),
}));

vi.mock('$lib/server/uploads', () => ({
	UPLOAD_DIR: '/tmp/uploads',
}));

vi.mock('fs', () => ({
	mkdirSync: vi.fn(),
	writeFileSync: vi.fn(),
}));

const { mockAdmZipConstructor, mockAdmZipInstance } = vi.hoisted(() => {
	const instance = { getEntry: vi.fn(), getEntries: vi.fn().mockReturnValue([]) };
	const constructor = vi.fn().mockImplementation(() => instance);
	return { mockAdmZipConstructor: constructor, mockAdmZipInstance: instance };
});
vi.mock('adm-zip', () => ({ default: mockAdmZipConstructor }));

const mockSelect = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();
const mockLureFindMany = vi.fn();

function makeSelectChain(result: any[] = []) {
	const self: any = {
		from: vi.fn(() => self),
		where: vi.fn(() => self),
		limit: vi.fn(() => Promise.resolve(result)),
		orderBy: vi.fn(() => self),
		then: (fn: any, rej: any) => Promise.resolve(result).then(fn, rej),
		catch: (fn: any) => Promise.resolve(result).catch(fn),
	};
	return self;
}

function makeUpdateChain() {
	const self: any = {
		set: vi.fn(() => self),
		where: vi.fn(() => Promise.resolve()),
	};
	return self;
}

function makeInsertChain() {
	const self: any = {
		values: vi.fn(() => self),
		onConflictDoUpdate: vi.fn(() => Promise.resolve()),
	};
	return self;
}

const mockClient = {
	transaction: vi.fn((fn: any) => fn),
	prepare: vi.fn().mockReturnValue({ run: vi.fn() }),
};

vi.mock('$lib/server/db', () => ({
	db: {
		select: mockSelect,
		update: mockUpdate,
		insert: mockInsert,
		query: { lure: { findMany: mockLureFindMany } },
	},
	client: mockClient,
}));

const mockEnv = await import('../../__mocks__/env');

const { load: qrLoad, actions: qrActions } = await import('../settings/qr/+page.server');
const { load: settingsLoad, actions: settingsActions } = await import('../settings/+page.server');
const { load: appearanceLoad, actions: appearanceActions } = await import('../settings/appearance/+page.server');

// ─── settings/qr ─────────────────────────────────────────────────────────────

describe('settings/qr load', () => {
	beforeEach(() => {
		mockEnv.env.BASE_URL = 'http://localhost:5173';
		mockLureFindMany.mockResolvedValue([]);
	});

	it('returns empty items when no unlabeled lures', async () => {
		const result = await qrLoad();
		expect(result.items).toEqual([]);
	});

	it('generates a QR SVG for each unlabeled lure', async () => {
		mockLureFindMany.mockResolvedValue([
			{ id: 'l1', lureNumber: 1, name: 'Spinner', brand: 'Rapala', color: 'Gold' }
		]);
		const result = await qrLoad();
		expect(result.items).toHaveLength(1);
		expect(result.items[0].qrSvg).toBe('<svg>qr</svg>');
		expect(result.items[0].id).toBe('l1');
	});

	it('falls back to localhost when BASE_URL is unset', async () => {
		mockEnv.env.BASE_URL = undefined;
		mockLureFindMany.mockResolvedValue([
			{ id: 'l1', lureNumber: 1, name: 'Spinner', brand: null, color: null }
		]);
		const result = await qrLoad();
		expect(result.items).toHaveLength(1);
	});
});

describe('settings/qr markLabeled action', () => {
	beforeEach(() => {
		mockUpdate.mockReturnValue(makeUpdateChain());
	});

	it('marks lure as labeled and returns success', async () => {
		const fd = new FormData();
		fd.append('id', 'l1');
		const result = await qrActions.markLabeled({ request: { formData: () => Promise.resolve(fd) } } as any);
		expect(result.success).toBe(true);
		expect(mockUpdate).toHaveBeenCalled();
	});

	it('skips update when id is absent', async () => {
		mockUpdate.mockClear();
		const fd = new FormData();
		const result = await qrActions.markLabeled({ request: { formData: () => Promise.resolve(fd) } } as any);
		expect(result.success).toBe(true);
		expect(mockUpdate).not.toHaveBeenCalled();
	});
});

// ─── settings load ────────────────────────────────────────────────────────────

describe('settings load', () => {
	beforeEach(() => {
		mockSelect.mockReturnValue(makeSelectChain([{ lureCount: 5, spotCount: 3, catchCount: 2 }]));
	});

	it('returns entity counts and schema hash', async () => {
		const result = await settingsLoad();
		expect(result.lureCount).toBe(5);
		expect(result.spotCount).toBe(3);
		expect(result.catchCount).toBe(2);
		expect(result.schemaHash).toBe('abc123def456');
	});
});

// ─── appearance load + action ─────────────────────────────────────────────────

describe('settings/appearance load', () => {
	it('returns defaults when no settings in DB', async () => {
		mockSelect.mockReturnValue(makeSelectChain([]));
		const result = await appearanceLoad();
		expect(result.colorMode).toBe('dark');
		expect(result.themeName).toBe('ocean');
	});

	it('returns stored colorMode and themeName from DB', async () => {
		mockSelect.mockReturnValue(makeSelectChain([
			{ key: 'colorMode', value: 'light' },
			{ key: 'themeName', value: 'ocean' },
		]));
		const result = await appearanceLoad();
		expect(result.colorMode).toBe('light');
		expect(result.themeName).toBe('ocean');
	});
});

describe('settings/appearance setMode action', () => {
	beforeEach(() => {
		mockInsert.mockClear();
		mockInsert.mockReturnValue(makeInsertChain());
	});

	it('saves valid mode to DB and sets cookie', async () => {
		const fd = new FormData();
		fd.append('colorMode', 'light');
		const mockCookieSet = vi.fn();
		await appearanceActions.setMode({
			request: { formData: () => Promise.resolve(fd) },
			cookies: { set: mockCookieSet },
		} as any);
		expect(mockInsert).toHaveBeenCalled();
		expect(mockCookieSet).toHaveBeenCalledWith('of_colormode', 'light', expect.any(Object));
	});

	it('ignores invalid mode values', async () => {
		const fd = new FormData();
		fd.append('colorMode', 'invalid');
		const mockCookieSet = vi.fn();
		await appearanceActions.setMode({
			request: { formData: () => Promise.resolve(fd) },
			cookies: { set: mockCookieSet },
		} as any);
		expect(mockInsert).not.toHaveBeenCalled();
		expect(mockCookieSet).not.toHaveBeenCalled();
	});
});

describe('settings/appearance setTheme action', () => {
	beforeEach(() => {
		mockInsert.mockClear();
		mockInsert.mockReturnValue(makeInsertChain());
	});

	it('saves valid theme to DB', async () => {
		const fd = new FormData();
		fd.append('themeName', 'ocean');
		await appearanceActions.setTheme({
			request: { formData: () => Promise.resolve(fd) },
		} as any);
		expect(mockInsert).toHaveBeenCalled();
	});

	it('ignores unknown theme ids', async () => {
		const fd = new FormData();
		fd.append('themeName', 'rainbow');
		await appearanceActions.setTheme({
			request: { formData: () => Promise.resolve(fd) },
		} as any);
		expect(mockInsert).not.toHaveBeenCalled();
	});
});

// ─── settings import action ───────────────────────────────────────────────────

describe('settings import action', () => {
	function fakeFile(name: string, size = 10): any {
		return { name, size, arrayBuffer: () => Promise.resolve(new ArrayBuffer(size)) };
	}

	function makeImportRequest(file: any): any {
		return { formData: () => Promise.resolve({ get: (k: string) => k === 'backup' ? file : null }) };
	}

	it('returns 400 when no file provided', async () => {
		const result = await settingsActions.import({ request: makeImportRequest(null) } as any);
		expect(result.status).toBe(400);
	});

	it('returns 400 when file size is zero', async () => {
		const result = await settingsActions.import({ request: makeImportRequest(fakeFile('backup.zip', 0)) } as any);
		expect(result.status).toBe(400);
	});

	it('returns 400 when file is not a zip', async () => {
		const result = await settingsActions.import({ request: makeImportRequest(fakeFile('backup.json')) } as any);
		expect(result.status).toBe(400);
	});

});
