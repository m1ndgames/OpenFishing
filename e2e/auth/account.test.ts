import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { ADMIN, BOB } from './fixtures';

test.describe('Account page', () => {
	test('shows the user\'s own email, username, storage and API token', async ({ page }) => {
		await login(page, BOB.email, BOB.password);
		await page.goto('/settings/account');
		await page.waitForLoadState('networkidle');

		await expect(page.locator('#email')).toHaveValue(BOB.email);
		await expect(page.locator('#username')).toHaveValue(BOB.username);
		await expect(page.getByText('Storage', { exact: true })).toBeVisible();
		await expect(page.getByText(BOB.apiToken)).toBeVisible();
	});

	test('can change the username (persists), then restores it', async ({ page }) => {
		await login(page, BOB.email, BOB.password);
		await page.goto('/settings/account');
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

test.describe('Admin account', () => {
	test('admin identity is env-controlled (no editable email/username/password)', async ({ page }) => {
		await login(page, ADMIN.username, ADMIN.password);
		await page.goto('/settings/account');
		await page.waitForLoadState('networkidle');

		// No editable identity fields for the admin.
		await expect(page.locator('#email')).toHaveCount(0);
		await expect(page.locator('#username')).toHaveCount(0);
		await expect(page.locator('#new')).toHaveCount(0);
		// The fixed "admin" username and the env-controlled note are shown.
		await expect(page.getByText('admin', { exact: true }).first()).toBeVisible();
		// API token + logout are still available.
		await expect(page.getByText(ADMIN.apiToken)).toBeVisible();
		await expect(page.getByRole('button', { name: /log out/i })).toBeVisible();
	});
});
