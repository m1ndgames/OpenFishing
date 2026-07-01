import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEnv: Record<string, string | undefined> = { CHATBOT: undefined };
const mockUserFindFirst = vi.fn();
const mockInsertValues = vi.fn(async () => undefined);
const mockUpdateSet = vi.fn();
const mockDeleteWhere = vi.fn(async () => undefined);

vi.mock('$env/dynamic/private', () => ({ env: mockEnv }));
vi.mock('@sveltejs/kit', () => ({
	fail: (status: number, data: any) => ({ status, data }),
}));
const reprovisionAdmin = vi.fn(async () => undefined);
const parseBackupZip = vi.fn(() => ({ payload: {}, extractPhotos: vi.fn() }));
const restoreAllBackup = vi.fn(() => ({ userCount: 2, lureCount: 3, spotCount: 1, catchCount: 1 }));
class BackupError extends Error { constructor(public key: string) { super(key); } }

vi.mock('$lib/server/auth', () => ({
	hashPassword: vi.fn(async () => 'hashed'),
	generateApiToken: vi.fn(() => 'token123'),
	DEFAULT_QUOTA_BYTES: 500 * 1024 * 1024,
	reprovisionAdmin,
}));
vi.mock('$lib/server/backup', () => ({ parseBackupZip, restoreAllBackup, BackupError }));
vi.mock('$lib/server/uploads', () => ({ deleteUpload: vi.fn(async () => undefined), getUsedBytes: vi.fn(async () => 0) }));
vi.mock('$lib/server/db', () => ({
	db: {
		query: { user: { findFirst: mockUserFindFirst } },
		select: () => ({ from: () => ({ where: async () => [], orderBy: async () => [] }) }),
		insert: () => ({ values: (v: any) => { mockInsertValues(v); const p: any = Promise.resolve(undefined); p.onConflictDoUpdate = async () => undefined; return p; } }),
		update: () => ({ set: (v: any) => { mockUpdateSet(v); return { where: async () => undefined }; } }),
		delete: () => ({ where: mockDeleteWhere }),
	},
}));

const { actions } = await import('../settings/admin/+page.server');

function form(entries: Record<string, string> = {}) {
	const fd = new FormData();
	for (const [k, v] of Object.entries(entries)) fd.append(k, v);
	return { formData: async () => fd } as any;
}

beforeEach(() => {
	mockUserFindFirst.mockReset();
	mockInsertValues.mockClear();
	mockUpdateSet.mockClear();
	mockDeleteWhere.mockClear();
});

describe('admin default appearance', () => {
	it('saves a valid default color mode to appSetting', async () => {
		const res: any = await actions.setDefaultMode({ request: form({ colorMode: 'light' }) } as any);
		expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ key: 'colorMode', value: 'light' }));
		expect(res).toMatchObject({ success: 'defaultsSaved' });
	});

	it('rejects an invalid color mode', async () => {
		const res: any = await actions.setDefaultMode({ request: form({ colorMode: 'rainbow' }) } as any);
		expect(res).toMatchObject({ status: 400, data: { error: 'invalidValue' } });
		expect(mockInsertValues).not.toHaveBeenCalled();
	});

	it('saves a valid default theme to appSetting', async () => {
		const res: any = await actions.setDefaultTheme({ request: form({ themeName: 'dusk' }) } as any);
		expect(mockInsertValues).toHaveBeenCalledWith(expect.objectContaining({ key: 'themeName', value: 'dusk' }));
		expect(res).toMatchObject({ success: 'defaultsSaved' });
	});

	it('rejects an unknown theme', async () => {
		const res: any = await actions.setDefaultTheme({ request: form({ themeName: 'not-a-theme' }) } as any);
		expect(res).toMatchObject({ status: 400, data: { error: 'invalidValue' } });
		expect(mockInsertValues).not.toHaveBeenCalled();
	});
});

describe('admin createUser', () => {
	it('fails when fields are missing', async () => {
		const res: any = await actions.createUser({ request: form({ email: 'a@b.com' }) } as any);
		expect(res).toMatchObject({ status: 400, data: { error: 'userFieldsRequired' } });
	});

	it('fails for an invalid email', async () => {
		const res: any = await actions.createUser({ request: form({ email: 'noat', username: 'bob', password: 'pw' }) } as any);
		expect(res).toMatchObject({ status: 400, data: { error: 'invalidEmail' } });
	});

	it('fails when email/username already exists', async () => {
		mockUserFindFirst.mockResolvedValue({ id: 'existing' });
		const res: any = await actions.createUser({ request: form({ email: 'a@b.com', username: 'bob', password: 'pw' }) } as any);
		expect(res).toMatchObject({ status: 409, data: { error: 'userExists' } });
	});

	it('creates a user with a default quota', async () => {
		mockUserFindFirst.mockResolvedValue(undefined);
		const res: any = await actions.createUser({ request: form({ email: 'a@b.com', username: 'bob', password: 'pw' }) } as any);
		expect(mockInsertValues).toHaveBeenCalledOnce();
		const values = mockInsertValues.mock.calls[0][0] as any;
		expect(values.email).toBe('a@b.com');
		expect(values.quotaBytes).toBe(500 * 1024 * 1024);
		expect(res).toMatchObject({ success: 'userCreated' });
	});

	it('converts a quota in MB to bytes', async () => {
		mockUserFindFirst.mockResolvedValue(undefined);
		await actions.createUser({ request: form({ email: 'a@b.com', username: 'bob', password: 'pw', quota_mb: '50' }) } as any);
		const values = mockInsertValues.mock.calls[0][0] as any;
		expect(values.quotaBytes).toBe(50 * 1024 * 1024);
	});
});

describe('admin updateUser', () => {
	it('returns 404 when the user is missing', async () => {
		mockUserFindFirst.mockResolvedValue(undefined);
		const res: any = await actions.updateUser({ request: form({ id: 'x', email: 'a@b.com', username: 'bob' }) } as any);
		expect(res).toMatchObject({ status: 404 });
	});

	it('only updates the admin quota (identity + password are env-locked)', async () => {
		mockUserFindFirst.mockResolvedValueOnce({ id: 'a1', isAdmin: true }); // findUser
		await actions.updateUser({ request: form({ id: 'a1', email: 'new@b.com', username: 'newname', quota_mb: '10', password: 'shouldbeignored' }) } as any);
		const set = mockUpdateSet.mock.calls[0][0] as any;
		expect(set.quotaBytes).toBe(10 * 1024 * 1024);
		expect(set.email).toBeUndefined();
		expect(set.username).toBeUndefined();
		// Admin password is never reset here, even if a value is provided
		expect(mockUpdateSet.mock.calls.every((c) => (c[0] as any).passwordHash === undefined)).toBe(true);
	});
});

describe('admin toggles & delete', () => {
	it('blocks disabling the admin account', async () => {
		mockUserFindFirst.mockResolvedValue({ id: 'a1', isAdmin: true, disabled: false });
		const res: any = await actions.toggleDisabled({ request: form({ id: 'a1' }) } as any);
		expect(res).toMatchObject({ status: 400, data: { error: 'cannotModifyAdmin' } });
	});

	it('toggles chatbot access', async () => {
		mockUserFindFirst.mockResolvedValue({ id: 'u1', chatbotEnabled: true });
		const res: any = await actions.toggleChatbot({ request: form({ id: 'u1' }) } as any);
		expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ chatbotEnabled: false }));
		expect(res).toMatchObject({ success: 'userUpdated' });
	});

	it('regenerates the API token', async () => {
		mockUserFindFirst.mockResolvedValue({ id: 'u1' });
		const res: any = await actions.regenerateToken({ request: form({ id: 'u1' }) } as any);
		expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ apiToken: 'token123' }));
		expect(res).toMatchObject({ success: 'tokenRegenerated' });
	});

	it('blocks deleting the admin account', async () => {
		mockUserFindFirst.mockResolvedValue({ id: 'a1', isAdmin: true });
		const res: any = await actions.deleteUser({ request: form({ id: 'a1' }) } as any);
		expect(res).toMatchObject({ status: 400, data: { error: 'cannotDeleteAdmin' } });
	});

	it('deletes a regular user', async () => {
		mockUserFindFirst.mockResolvedValue({ id: 'u1', isAdmin: false });
		const res: any = await actions.deleteUser({ request: form({ id: 'u1' }) } as any);
		expect(mockDeleteWhere).toHaveBeenCalled();
		expect(res).toMatchObject({ success: 'userDeleted' });
	});
});

describe('admin updateUser (regular user)', () => {
	it('validates required fields for a non-admin user', async () => {
		mockUserFindFirst.mockResolvedValue({ id: 'u1', isAdmin: false });
		const res: any = await actions.updateUser({ request: form({ id: 'u1', email: '', username: '' }) } as any);
		expect(res).toMatchObject({ status: 400, data: { error: 'userFieldsRequired' } });
	});

	it('validates email format for a non-admin user', async () => {
		mockUserFindFirst.mockResolvedValue({ id: 'u1', isAdmin: false });
		const res: any = await actions.updateUser({ request: form({ id: 'u1', email: 'noatsign', username: 'bob' }) } as any);
		expect(res).toMatchObject({ status: 400, data: { error: 'invalidEmail' } });
	});

	it('rejects a duplicate email/username clash', async () => {
		mockUserFindFirst
			.mockResolvedValueOnce({ id: 'u1', isAdmin: false })
			.mockResolvedValueOnce({ id: 'u2' }); // clash
		const res: any = await actions.updateUser({ request: form({ id: 'u1', email: 'a@b.com', username: 'taken' }) } as any);
		expect(res).toMatchObject({ status: 409, data: { error: 'userExists' } });
	});

	it('updates email, username, and quota for a regular user', async () => {
		mockUserFindFirst
			.mockResolvedValueOnce({ id: 'u1', isAdmin: false })
			.mockResolvedValueOnce(undefined); // no clash
		const res: any = await actions.updateUser({ request: form({ id: 'u1', email: 'new@b.com', username: 'newname', quota_mb: '100' }) } as any);
		expect(mockUpdateSet).toHaveBeenCalledWith(expect.objectContaining({ email: 'new@b.com', username: 'newname', quotaBytes: 100 * 1024 * 1024 }));
		expect(res).toMatchObject({ success: 'userUpdated' });
	});

	it('updates password when a new_password is provided', async () => {
		mockUserFindFirst
			.mockResolvedValueOnce({ id: 'u1', isAdmin: false })
			.mockResolvedValueOnce(undefined); // no clash
		await actions.updateUser({ request: form({ id: 'u1', email: 'a@b.com', username: 'bob', password: 'newpw' }) } as any);
		const passwordUpdate = mockUpdateSet.mock.calls.find((c: any[]) => c[0].passwordHash !== undefined);
		expect(passwordUpdate).toBeTruthy();
	});
});

describe('admin toggleDisabled / regenerateToken / toggleChatbot not-found', () => {
	it('returns 404 when target user is not found for toggleDisabled', async () => {
		mockUserFindFirst.mockResolvedValue(undefined);
		const res: any = await actions.toggleDisabled({ request: form({ id: 'missing' }) } as any);
		expect(res).toMatchObject({ status: 404 });
	});

	it('returns 404 when target user is not found for regenerateToken', async () => {
		mockUserFindFirst.mockResolvedValue(undefined);
		const res: any = await actions.regenerateToken({ request: form({ id: 'missing' }) } as any);
		expect(res).toMatchObject({ status: 404 });
	});

	it('returns 404 when target user is not found for toggleChatbot', async () => {
		mockUserFindFirst.mockResolvedValue(undefined);
		const res: any = await actions.toggleChatbot({ request: form({ id: 'missing' }) } as any);
		expect(res).toMatchObject({ status: 404 });
	});

	it('returns 404 when target user is not found for deleteUser', async () => {
		mockUserFindFirst.mockResolvedValue(undefined);
		const res: any = await actions.deleteUser({ request: form({ id: 'missing' }) } as any);
		expect(res).toMatchObject({ status: 404 });
	});
});

describe('admin restoreAll', () => {
	function fileForm(name: string | null) {
		const file = name ? { name, size: 10, arrayBuffer: async () => new ArrayBuffer(10) } : null;
		const fd = { get: (k: string) => (k === 'backup' ? file : null) };
		return { request: { formData: async () => fd } } as any;
	}

	beforeEach(() => {
		reprovisionAdmin.mockClear();
		parseBackupZip.mockClear();
		restoreAllBackup.mockClear();
		parseBackupZip.mockReturnValue({ payload: {}, extractPhotos: vi.fn() } as any);
	});

	it('fails when no file is provided', async () => {
		const res: any = await actions.restoreAll(fileForm(null));
		expect(res).toMatchObject({ status: 400, data: { error: 'backupErrorNoFile' } });
	});

	it('fails for a non-zip file', async () => {
		const res: any = await actions.restoreAll(fileForm('data.txt'));
		expect(res).toMatchObject({ status: 400, data: { error: 'backupErrorNotZip' } });
	});

	it('restores all and re-syncs the env admin', async () => {
		const res: any = await actions.restoreAll(fileForm('full.zip'));
		expect(restoreAllBackup).toHaveBeenCalledOnce();
		expect(reprovisionAdmin).toHaveBeenCalledOnce();
		expect(res).toMatchObject({ success: 'restoreAllDone' });
	});

	it('surfaces a BackupError as a fail with its key', async () => {
		parseBackupZip.mockImplementation(() => { throw new BackupError('backupErrorExpectedAll'); });
		const res: any = await actions.restoreAll(fileForm('personal.zip'));
		expect(res).toMatchObject({ status: 400, data: { error: 'backupErrorExpectedAll' } });
		expect(reprovisionAdmin).not.toHaveBeenCalled();
	});

	it('returns 409 for a schema mismatch (backupErrorSchema)', async () => {
		parseBackupZip.mockImplementation(() => { throw new BackupError('backupErrorSchema'); });
		const res: any = await actions.restoreAll(fileForm('old.zip'));
		expect(res).toMatchObject({ status: 409, data: { error: 'backupErrorSchema' } });
	});
});
