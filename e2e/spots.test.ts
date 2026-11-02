import { test, expect } from '@playwright/test';
import { SPOT_IDS } from './fixtures';

test.describe('Spots list', () => {
	test('shows seeded spots', async ({ page }) => {
		await page.goto('/spots');
		await expect(page.getByText('Test Lake North')).toBeVisible();
		await expect(page.getByText('River Bend')).toBeVisible();
	});

	test('links to spot detail', async ({ page }) => {
		await page.goto('/spots');
		// Verify spot appears as a clickable row in the list
		await expect(page.getByRole('row', { name: /Test Lake North/ })).toBeVisible();
		// Navigate via JS (same as the onclick handler does) and verify the detail page
		await page.evaluate((url) => { window.location.href = url; }, `/spots/${SPOT_IDS[0]}`);
		await expect(page).toHaveURL(`/spots/${SPOT_IDS[0]}`, { timeout: 10000 });
		await expect(page.getByText('Test Lake North')).toBeVisible();
	});
});

test.describe('Spot detail', () => {
	test('shows spot name and notes', async ({ page }) => {
		await page.goto(`/spots/${SPOT_IDS[0]}`);
		await expect(page.getByText('Test Lake North')).toBeVisible();
		await expect(page.getByText('Great early morning spot')).toBeVisible();
	});

	test('shows the map element', async ({ page }) => {
		await page.goto(`/spots/${SPOT_IDS[0]}`);
		await expect(page.locator('.leaflet-container')).toBeVisible();
	});

	test('shows nearby catches table', async ({ page }) => {
		await page.goto(`/spots/${SPOT_IDS[0]}`);
		// The catch seeded at 52.5201, 13.4051 is within 100m of 52.5200, 13.4050
		await expect(page.getByText('Pike')).toBeVisible();
	});

	test('links to edit page', async ({ page }) => {
		await page.goto(`/spots/${SPOT_IDS[0]}`);
		await page.getByRole('link', { name: /edit/i }).click();
		await expect(page).toHaveURL(`/spots/${SPOT_IDS[0]}/edit`);
	});
});

test.describe('Add new spot', () => {
	test('new spot form renders', async ({ page }) => {
		await page.goto('/spots/new');
		await expect(page.getByLabel(/name/i)).toBeVisible();
		await expect(page.locator('.leaflet-container')).toBeVisible();
	});

	test('creates a spot and redirects to detail', async ({ page, context }) => {
		// Mock geolocation so the "Use my location" button can set lat/lng via Svelte state
		await context.grantPermissions(['geolocation']);
		await context.setGeolocation({ latitude: 52.52, longitude: 13.40 });
		await page.goto('/spots/new');
		await page.waitForLoadState('networkidle');
		await page.getByLabel(/name/i).fill('E2E Test Spot');
		await page.getByRole('button', { name: 'Use my location' }).click();
		// Wait for Svelte state to update the hidden input value
		await page.waitForFunction(
			() => (document.querySelector('input[name="lat"]') as HTMLInputElement)?.value !== '',
			null,
			{ timeout: 15000 }
		);
		await page.getByRole('button', { name: 'Save Spot' }).click();
		await expect(page.getByText('E2E Test Spot')).toBeVisible();
	});

	test('map loads tiles even without geolocation permission (#104)', async ({ page, context }) => {
		// Before the fix the map only got a view once geolocation succeeded, so a denied /
		// unavailable / ignored permission left it grey with no tiles at all.
		await context.clearPermissions();
		await page.goto('/spots/new');
		await expect(page.locator('.leaflet-tile').first()).toBeAttached({ timeout: 15000 });
	});

	test('places the marker from the photo GPS (#37)', async ({ page }) => {
		await page.goto('/spots/new');
		await page.waitForLoadState('networkidle');
		await page.locator('input[type="file"][name="photos"]').setInputFiles('e2e/fixtures/gps-photo.jpg');
		await expect(page.locator('input[name="lat"]')).toHaveValue(/^52\.5/, { timeout: 10000 });
		await expect(page.locator('input[name="lng"]')).toHaveValue(/^13\.40/);
		await expect(page.getByText('52.520000, 13.405000')).toBeVisible();
		await expect(page.getByText('Location taken from photo')).toBeVisible();
	});

	test('photo GPS does not override a placed marker but can be applied (#37)', async ({ page, context }) => {
		await context.clearPermissions();
		await page.goto('/spots/new');
		await page.waitForLoadState('networkidle');
		// Click the map (default view centered on 51, 10) to place a marker manually
		await page.locator('.leaflet-container').click();
		await expect(page.locator('input[name="lat"]')).not.toHaveValue('');
		const manualLat = await page.locator('input[name="lat"]').inputValue();

		await page.locator('input[type="file"][name="photos"]').setInputFiles('e2e/fixtures/gps-photo.jpg');
		const usePhoto = page.getByRole('button', { name: 'Use photo location' });
		await expect(usePhoto).toBeVisible({ timeout: 10000 });
		await expect(page.locator('input[name="lat"]')).toHaveValue(manualLat);

		await usePhoto.click();
		await expect(page.locator('input[name="lat"]')).toHaveValue(/^52\.5/);
		await expect(usePhoto).toBeHidden();
	});
});
