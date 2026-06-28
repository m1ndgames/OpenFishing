import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
	test('home page loads', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/OpenFishing/i);
	});

	test('nav link to Spots works', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /spots/i }).first().click();
		await expect(page).toHaveURL('/spots');
	});

	test('nav link to Catches works', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /catches/i }).first().click();
		await expect(page).toHaveURL('/catches');
	});

	test('stats page loads', async ({ page }) => {
		await page.goto('/stats');
		await expect(page.getByText(/total catches|species|spots fished/i).first()).toBeVisible();
	});

	test('QR settings page loads', async ({ page }) => {
		await page.goto('/settings/qr');
		await expect(page).toHaveURL('/settings/qr');
	});

	test('tackle page loads', async ({ page }) => {
		await page.goto('/tackle');
		await expect(page).toHaveURL('/tackle');
	});

	test('settings page loads', async ({ page }) => {
		await page.goto('/settings');
		await expect(page).toHaveURL('/settings');
	});
});

test.describe('Share pages', () => {
	test('invalid share token returns 404 or error page', async ({ page }) => {
		const res = await page.goto('/share/lures/invalid-token-xyz');
		expect(res?.status()).toBe(404);
	});
});
