import { test, expect } from '@playwright/test';
import { CATCH_IDS, LURE_IDS } from './fixtures';

test.describe('Catches list', () => {
	test('shows seeded catches', async ({ page }) => {
		await page.goto('/catches');
		// Use link role to avoid matching "Pike" in filter dropdowns
		await expect(page.locator('a').filter({ hasText: 'Pike' }).first()).toBeVisible();
		await expect(page.locator('a').filter({ hasText: 'Perch' }).first()).toBeVisible();
	});

	test('links to catch detail', async ({ page }) => {
		await page.goto('/catches');
		await page.locator('a').filter({ hasText: 'Pike' }).first().click();
		await expect(page).toHaveURL(`/catches/${CATCH_IDS[0]}`);
	});
});

test.describe('Catch detail', () => {
	test('shows species, weight and length', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByText('Pike')).toBeVisible();
		await expect(page.getByText('1800')).toBeVisible();
		await expect(page.getByText('62')).toBeVisible();
	});

	test('shows linked lure', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByText('Silver Spinner')).toBeVisible();
	});

	test('shows nearby spot link', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByText('Test Lake North')).toBeVisible();
	});

	test('shows bite index', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByText('7.5')).toBeVisible();
	});

	test('links to edit page', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await page.getByRole('link', { name: /edit/i }).click();
		await expect(page).toHaveURL(`/catches/${CATCH_IDS[0]}/edit`);
	});
});

test.describe('Add new catch', () => {
	test('new catch form renders with species and lure fields', async ({ page }) => {
		await page.goto('/catches/new');
		await expect(page.getByLabel(/species/i)).toBeVisible();
	});

	test('creates a catch and redirects to detail', async ({ page, context }) => {
		// The catch form requires lat/lng — use geolocation mock and the locate button
		await context.grantPermissions(['geolocation']);
		await context.setGeolocation({ latitude: 52.52, longitude: 13.40 });
		await page.goto('/catches/new');
		// networkidle ensures HMR is settled before geolocation interaction
		await page.waitForLoadState('networkidle');
		await page.getByLabel(/species/i).fill('Zander');
		await page.getByRole('button', { name: 'Use my location' }).click();
		// Wait for Svelte state to update the hidden lat input
		await page.waitForFunction(
			() => (document.querySelector('input[name="lat"]') as HTMLInputElement)?.value !== '',
			null,
			{ timeout: 15000 }
		);
		await page.getByRole('button', { name: 'Log Catch' }).click();
		await expect(page.getByText('Zander')).toBeVisible();
		await expect(page).toHaveURL(/\/catches\//);
	});
});
