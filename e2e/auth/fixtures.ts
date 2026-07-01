// Fixed identities + tokens for the auth-enabled (multi-user) E2E suite.
// AUTH_PASSWORD is set to ADMIN.password in playwright.auth.config.ts.

export const ADMIN = {
	id: 'admin-00000000-0000-0000-000000000001',
	username: 'admin',
	// Admin has no email — it logs in by username only.
	password: 'e2e-secret',
	apiToken: 'admintoken000000000000000000000000000000000000aa01'
};

export const BOB = {
	id: 'bob-000000000-0000-0000-000000000002',
	username: 'bob',
	email: 'bob@example.com',
	password: 'bobpass123',
	apiToken: 'bobtoken00000000000000000000000000000000000000bb02'
};

export const ADMIN_LURE = { id: 'aaaa0000-0000-0000-0000-0000000000a1', name: 'Admin Spinner' };
export const BOB_LURE = { id: 'bbbb0000-0000-0000-0000-0000000000b1', name: 'Bob Crankbait' };

export const ADMIN_SPOT = { id: 'aaaa0000-0000-0000-0000-0000000000a2', name: 'Admin Lake' };
export const BOB_SPOT = { id: 'bbbb0000-0000-0000-0000-0000000000b2', name: 'Bob River' };

// A photo file is written to UPLOAD_PATH for the admin lure so storage-usage shows non-zero.
export const ADMIN_PHOTO = 'admin-photo.jpg';
