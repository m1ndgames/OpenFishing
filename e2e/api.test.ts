import { test, expect } from '@playwright/test';
import { LURE_IDS, SPOT_IDS, CATCH_IDS } from './fixtures';

test.describe('REST API v1 — no auth', () => {
	test('GET /api/v1/lures returns lure array', async ({ request }) => {
		const res = await request.get('/api/v1/lures');
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
		expect(body.length).toBeGreaterThanOrEqual(3);
		expect(body[0]).toHaveProperty('id');
		expect(body[0]).toHaveProperty('name');
		expect(body[0]).toHaveProperty('tags');
		expect(body[0]).not.toHaveProperty('photoPath');
	});

	test('GET /api/v1/lures/:id returns a single lure', async ({ request }) => {
		const res = await request.get(`/api/v1/lures/${LURE_IDS[0]}`);
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(body.name).toBe('Silver Spinner');
		expect(body.brand).toBe('Mepps');
	});

	test('GET /api/v1/lures/:id returns 404 for unknown id', async ({ request }) => {
		const res = await request.get('/api/v1/lures/does-not-exist');
		expect(res.status()).toBe(404);
	});

	test('GET /api/v1/spots returns spot array', async ({ request }) => {
		const res = await request.get('/api/v1/spots');
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
		expect(body.length).toBeGreaterThanOrEqual(2);
		expect(body[0]).toHaveProperty('lat');
		expect(body[0]).toHaveProperty('lng');
	});

	test('GET /api/v1/spots/:id returns a single spot', async ({ request }) => {
		const res = await request.get(`/api/v1/spots/${SPOT_IDS[0]}`);
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(body.name).toBe('Test Lake North');
	});

	test('GET /api/v1/catches returns catch array', async ({ request }) => {
		const res = await request.get('/api/v1/catches');
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
		expect(body.length).toBeGreaterThanOrEqual(2);
		expect(body[0]).toHaveProperty('species');
		expect(body[0]).toHaveProperty('lure');
	});

	test('GET /api/v1/catches/:id returns a single catch', async ({ request }) => {
		const res = await request.get(`/api/v1/catches/${CATCH_IDS[0]}`);
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(body.species).toBe('Pike');
		expect(body.lure?.name).toBe('Silver Spinner');
	});

	test('GET /api/v1/rods returns rod array', async ({ request }) => {
		const res = await request.get('/api/v1/rods');
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(Array.isArray(body)).toBe(true);
	});

	test('GET /api/v1/reels returns reel array', async ({ request }) => {
		const res = await request.get('/api/v1/reels');
		expect(res.status()).toBe(200);
	});

	test('GET /api/v1/lines returns line array', async ({ request }) => {
		const res = await request.get('/api/v1/lines');
		expect(res.status()).toBe(200);
	});

	test('GET /api/v1/combos returns combo array', async ({ request }) => {
		const res = await request.get('/api/v1/combos');
		expect(res.status()).toBe(200);
		const body = await res.json();
		expect(body[0].name).toBe('Pike Setup');
	});
});

test.describe('Catch CSV export API', () => {
	test('GET /api/catches/export returns 200 with text/csv content-type', async ({ request }) => {
		const res = await request.get('/api/catches/export');
		expect(res.status()).toBe(200);
		expect(res.headers()['content-type']).toContain('text/csv');
	});

	test('response starts with UTF-8 BOM bytes', async ({ request }) => {
		const res = await request.get('/api/catches/export');
		const buf = new Uint8Array(await res.body());
		expect(buf[0]).toBe(0xEF);
		expect(buf[1]).toBe(0xBB);
		expect(buf[2]).toBe(0xBF);
	});

	test('response includes CSV header row', async ({ request }) => {
		const res = await request.get('/api/catches/export');
		const text = await res.text();
		const firstLine = text.replace(/^﻿/, '').split('\r\n')[0];
		expect(firstLine).toContain('Date');
		expect(firstLine).toContain('Species');
		expect(firstLine).toContain('Weight (g)');
		expect(firstLine).toContain('Catch & Release');
		expect(firstLine).toContain('Lure');
	});

	test('seeded catches appear in default (current-year) export', async ({ request }) => {
		const res = await request.get('/api/catches/export');
		const text = await res.text();
		// Seeded catches (Pike, Perch) inserted with caughtAt = now, so they're in current year
		expect(text).toContain('Pike');
		expect(text).toContain('Silver Spinner');
	});

	test('date range filter excludes catches outside range', async ({ request }) => {
		const res = await request.get('/api/catches/export?from=2000-01-01&to=2000-12-31');
		const text = await res.text();
		// TextDecoder strips the BOM, text starts with 'Date'
		const lines = text.split('\r\n').filter(Boolean);
		// Only the header row — no catches from year 2000
		expect(lines).toHaveLength(1);
	});

	test('Content-Disposition header triggers download with .csv filename', async ({ request }) => {
		const res = await request.get('/api/catches/export');
		const disposition = res.headers()['content-disposition'] ?? '';
		expect(disposition).toContain('attachment');
		expect(disposition).toContain('.csv');
	});
});

test.describe('Lang API', () => {
	test('POST /api/lang sets lang cookie', async ({ page }) => {
		// /api/lang does a 303 redirect — Set-Cookie is on the redirect response.
		// Use the page request context (shared cookie jar) and verify via context.cookies().
		await page.goto('/');
		await page.request.post('/api/lang', { form: { lang: 'de' } });
		const cookies = await page.context().cookies();
		const langCookie = cookies.find(c => c.name === 'lang');
		expect(langCookie?.value).toBe('de');
		// Restore to English
		await page.request.post('/api/lang', { form: { lang: 'en' } });
	});
});
