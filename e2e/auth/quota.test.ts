import { test, expect } from '@playwright/test';
import { login, logout } from './helpers';
import { ADMIN } from './fixtures';

// Admin creates a user with a 0 MB quota, then that user's photo upload is rejected
// by the server-side quota check (413). The byte-level enforcement is also covered by
// the uploads unit tests; this exercises it end-to-end through the real add-lure flow.
test.describe('Upload quota enforcement', () => {
	test('a 0 MB-quota user is blocked from uploading a photo', async ({ page }) => {
		// 1. Admin creates the constrained user.
		await login(page, ADMIN.username, ADMIN.password);
		await page.goto('/admin');
		await page.waitForLoadState('networkidle');
		await page.locator('#c_email').fill('quser@example.com');
		await page.locator('#c_username').fill('quser');
		await page.locator('#c_password').fill('quserpass1');
		await page.locator('#c_quota').fill('0'); // 0 MB → any upload exceeds it
		await Promise.all([
			page.waitForResponse((r) => r.url().includes('/admin') && r.request().method() === 'POST'),
			page.getByRole('button', { name: 'Create', exact: true }).click()
		]);
		await expect(page.getByText('quser', { exact: true }).first()).toBeVisible();

		// 2. Switch to the constrained user.
		await logout(page);
		await login(page, 'quser', 'quserpass1');

		// 3. Run the add-lure photo flow; the save must be rejected with 413.
		await page.goto('/lures/new');
		await page.waitForLoadState('networkidle');
		await page.getByLabel(/name/i).fill('Quota Test Lure');
		await page.locator('input[type="file"][accept="image/*"]:not([capture]):not([name])').setInputFiles('e2e/fixtures/test-photo.jpg');
		await page.waitForSelector('.cropper-canvas', { state: 'visible', timeout: 30000 });
		await page.getByRole('button', { name: 'Apply' }).click();
		await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 15000 });

		const [resp] = await Promise.all([
			page.waitForResponse((r) => r.url().includes('/lures/new') && r.request().method() === 'POST'),
			page.getByRole('button', { name: 'Save Lure' }).click()
		]);
		expect(resp.status()).toBe(413);
		// Still on the form (no redirect to a detail page).
		await expect(page).toHaveURL(/\/lures\/new/);
	});
});
