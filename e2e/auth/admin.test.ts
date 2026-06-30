import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { ADMIN, BOB } from './fixtures';

test.describe('Admin backend', () => {
	test('admin sees the user list with storage usage', async ({ page }) => {
		await login(page, ADMIN.username, ADMIN.password);
		await page.goto('/admin');
		await page.waitForLoadState('networkidle');
		// Both accounts listed
		await expect(page.getByText(ADMIN.username, { exact: true }).first()).toBeVisible();
		await expect(page.getByText(BOB.username, { exact: true }).first()).toBeVisible();
		// Admin has a seeded 5 MB photo → usage shows a non-zero MB figure
		await expect(page.getByText(/Usage:\s*[1-9]/).first()).toBeVisible();
	});

	test('admin can create a new user', async ({ page }) => {
		await login(page, ADMIN.username, ADMIN.password);
		await page.goto('/admin');
		await page.waitForLoadState('networkidle');

		await page.locator('#c_email').fill('carol@example.com');
		await page.locator('#c_username').fill('carol');
		await page.locator('#c_password').fill('carolpass123');
		await page.locator('#c_quota').fill('100');
		await Promise.all([
			page.waitForResponse((r) => r.url().includes('/admin') && r.request().method() === 'POST'),
			page.getByRole('button', { name: 'Create', exact: true }).click()
		]);
		await page.waitForLoadState('networkidle');
		await expect(page.getByText('carol', { exact: true }).first()).toBeVisible();
		// The created user's email is bound to an input value (property, not attribute).
		const emails = await page.locator('input[type="email"]').evaluateAll((els) => els.map((e) => (e as HTMLInputElement).value));
		expect(emails).toContain('carol@example.com');
	});

	test('non-admin (bob) is redirected away from /admin', async ({ page }) => {
		await login(page, BOB.email, BOB.password);
		await page.goto('/admin');
		await expect(page).toHaveURL((u) => u.pathname === '/');
	});
});
