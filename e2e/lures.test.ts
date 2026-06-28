import { test, expect } from '@playwright/test';
import { LURE_IDS } from './fixtures';

test.describe('Lure overview', () => {
	test('loads the lure grid with seeded lures', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Silver Spinner')).toBeVisible();
		await expect(page.getByText('Gold Jig')).toBeVisible();
	});

	test('shows the lost lure with a LOST badge', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Lost Crankbait')).toBeVisible();
		await expect(page.getByText('LOST').first()).toBeVisible();
	});

	test('favourites filter shows only favourite lures', async ({ page }) => {
		await page.goto('/');
		// networkidle waits for Vite HMR to settle and Svelte to finish hydrating all handlers
		await page.waitForLoadState('networkidle');
		await page.getByRole('button', { name: 'Filters' }).click();
		// Spinner chip only appears when the filter panel is open (confirms Svelte is hydrated)
		await page.getByText('Spinner', { exact: true }).first().waitFor({ state: 'visible', timeout: 5000 });
		// Favourites toggle is SVG-only (no text). Find the first button that:
		//  - is not inside an <a> link (excludes lure card heart buttons)
		//  - has no text content (excludes Filters / chip buttons)
		//  - has a preceding sibling element (excludes standalone icon buttons)
		await page.evaluate(() => {
			for (const btn of Array.from(document.querySelectorAll('button'))) {
				if ((btn as HTMLElement).closest('a')) continue;
				if ((btn as HTMLElement).textContent?.trim()) continue;
				if (!(btn as HTMLElement).previousElementSibling) continue;
				(btn as HTMLButtonElement).click();
				return;
			}
		});
		await expect(page.getByText('Gold Jig')).toBeVisible({ timeout: 5000 });
		await expect(page.getByText('Silver Spinner')).not.toBeVisible({ timeout: 5000 });
	});

	test('type chip-filter includes matching lures', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.getByRole('button', { name: 'Filters' }).click();
		await page.getByText('Spinner', { exact: true }).first().click();
		await expect(page.getByText('Silver Spinner')).toBeVisible();
		await expect(page.getByText('Gold Jig')).not.toBeVisible();
	});
});

test.describe('Lure detail', () => {
	test('shows lure name, brand and type', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}`);
		await expect(page.getByRole('heading', { name: 'Silver Spinner' })).toBeVisible();
		await expect(page.getByText('Mepps')).toBeVisible();
		await expect(page.getByText('Spinner', { exact: true })).toBeVisible();
	});

	test('shows associated tags', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}`);
		await expect(page.getByText('river')).toBeVisible();
		await expect(page.getByText('lake')).toBeVisible();
	});

	test('detail page links to edit', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}`);
		await page.getByRole('link', { name: /edit/i }).click();
		await expect(page).toHaveURL(`/lures/${LURE_IDS[0]}/edit`);
	});
});

test.describe('Lure edit', () => {
	test('edit form is pre-populated with existing values', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}/edit`);
		await expect(page.getByLabel(/name/i)).toHaveValue('Silver Spinner');
		await expect(page.getByLabel(/brand/i)).toHaveValue('Mepps');
	});

	test('can update the lure name and save', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}/edit`);
		// networkidle prevents Vite HMR from resetting input values between fill() and click()
		await page.waitForLoadState('networkidle');
		await page.getByLabel(/name/i).fill('Silver Spinner Updated');
		await page.getByRole('button', { name: 'Save Changes' }).click();
		await expect(page.getByText('Silver Spinner Updated')).toBeVisible();
		// Restore
		await page.goto(`/lures/${LURE_IDS[0]}/edit`);
		await page.waitForLoadState('networkidle');
		await page.getByLabel(/name/i).fill('Silver Spinner');
		await page.getByRole('button', { name: 'Save Changes' }).click();
	});
});

test.describe('Add new lure', () => {
	test('new lure form renders required fields', async ({ page }) => {
		await page.goto('/lures/new');
		await expect(page.getByLabel(/name/i)).toBeVisible();
		await expect(page.getByLabel(/brand/i)).toBeVisible();
		await expect(page.getByLabel('Type', { exact: true })).toBeVisible();
	});

	test('creates a lure and redirects to detail page', async ({ page }) => {
		await page.goto('/lures/new');
		await page.waitForLoadState('networkidle');
		await page.getByLabel(/name/i).fill('E2E Test Lure');
		await page.getByLabel(/brand/i).fill('TestBrand');
		// Upload photo via the hidden file input (triggers CropModal)
		await page.locator('input[type="file"][accept="image/*"]:not([capture]):not([name])').setInputFiles('e2e/fixtures/test-photo.jpg');
		// Wait for CropperJS to fully initialize — image must load first, so allow extra time in CI
		await page.waitForSelector('.cropper-canvas', { state: 'visible', timeout: 30000 });
		// Confirm crop
		await page.getByRole('button', { name: 'Apply' }).click();
		// Wait for photo preview then save
		await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 15000 });
		await page.getByRole('button', { name: 'Save Lure' }).click();
		await expect(page).toHaveURL(/\/lures\//, { timeout: 15000 });
		await expect(page.getByText('E2E Test Lure')).toBeVisible();
	});
});

test.describe('Favourite toggle', () => {
	test('toggles favourite via API and reflects in UI', async ({ page }) => {
		const res = await page.request.post(`/api/lures/${LURE_IDS[0]}/favourite`);
		expect(res.status()).toBe(200);
		const json = await res.json();
		expect(typeof json.favourite).toBe('boolean');
		// Restore
		await page.request.post(`/api/lures/${LURE_IDS[0]}/favourite`);
	});
});
