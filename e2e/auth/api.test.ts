import { test, expect } from '@playwright/test';
import { ADMIN, BOB, ADMIN_LURE, BOB_LURE } from './fixtures';

test.describe('REST API v1 — per-user Bearer token', () => {
	test('rejects requests with no token (401)', async ({ request }) => {
		const res = await request.get('/api/v1/lures');
		expect(res.status()).toBe(401);
	});

	test('rejects requests with an unknown token (401)', async ({ request }) => {
		const res = await request.get('/api/v1/lures', { headers: { Authorization: 'Bearer nope' } });
		expect(res.status()).toBe(401);
	});

	test('bob\'s token returns only bob\'s lures', async ({ request }) => {
		const res = await request.get('/api/v1/lures', { headers: { Authorization: `Bearer ${BOB.apiToken}` } });
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
		const names = body.map((l: { name: string }) => l.name);
		expect(names).toContain(BOB_LURE.name);
		expect(names).not.toContain(ADMIN_LURE.name);
		// No internal fields leak
		expect(body[0]).not.toHaveProperty('userId');
		expect(body[0]).not.toHaveProperty('photoPath');
		expect(body[0]).toHaveProperty('tags');
	});

	test('admin\'s token returns only admin\'s lures', async ({ request }) => {
		const res = await request.get('/api/v1/lures', { headers: { Authorization: `Bearer ${ADMIN.apiToken}` } });
		expect(res.status()).toBe(200);
		const body = await res.json();
		const names = body.map((l: { name: string }) => l.name);
		expect(names).toContain(ADMIN_LURE.name);
		expect(names).not.toContain(BOB_LURE.name);
	});

	test('a single lure by id is scoped to the token owner (404 cross-user)', async ({ request }) => {
		const ok = await request.get(`/api/v1/lures/${BOB_LURE.id}`, { headers: { Authorization: `Bearer ${BOB.apiToken}` } });
		expect(ok.status()).toBe(200);
		const cross = await request.get(`/api/v1/lures/${ADMIN_LURE.id}`, { headers: { Authorization: `Bearer ${BOB.apiToken}` } });
		expect(cross.status()).toBe(404);
	});
});
