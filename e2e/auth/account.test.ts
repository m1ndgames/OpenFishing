import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { BOB } from './fixtures';

test.describe('Account page', () => {
	test('shows the user\'s own email, username, storage and API token', async ({ page }) => {
		await login(page, BOB.email, BOB.password);
		await page.goto('/account');
		await page.waitForLoadState('networkidle');

		await expect(page.locator('#email')).toHaveValue(BOB.email);
		await expect(page.locator('#username')).toHaveValue(BOB.username);
		await expect(page.getByText('Storage', { exact: true })).toBeVisible();
		await expect(page.getByText(BOB.apiToken)).toBeVisible();
	});

	test('can change the username (persists), then restores it', async ({ page }) => {
		await login(page, BOB.email, BOB.password);
		await page.goto('/account');
		await page.waitForLoadState('networkidle');

		// Rename to "bobby"
		await page.locator('#username').fill('bobby');
		await Promise.all([
			page.waitForResponse((r) => r.url().includes('/account') && r.request().method() === 'POST'),
			page.getByRole('button', { name: 'Save profile' }).click()
		]);
		await page.reload();
		await page.waitForLoadState('networkidle');
		await expect(page.locator('#username')).toHaveValue('bobby');

		// Restore to "bob" so later specs (which log in as bob) still work
		await page.locator('#username').fill(BOB.username);
		await Promise.all([
			page.waitForResponse((r) => r.url().includes('/account') && r.request().method() === 'POST'),
			page.getByRole('button', { name: 'Save profile' }).click()
		]);
		await page.reload();
		await page.waitForLoadState('networkidle');
		await expect(page.locator('#username')).toHaveValue(BOB.username);
	});
});
