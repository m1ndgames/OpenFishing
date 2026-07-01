import { test, expect } from '@playwright/test';
import { login, logout } from './helpers';
import { ADMIN, BOB } from './fixtures';

test.describe('Admin backend', () => {
	test('admin sees the user list with storage usage', async ({ page }) => {
		await login(page, ADMIN.username, ADMIN.password);
		await page.goto('/settings/admin');
		await page.waitForLoadState('networkidle');
		// Both accounts listed
		await expect(page.getByText(ADMIN.username, { exact: true }).first()).toBeVisible();
		await expect(page.getByText(BOB.username, { exact: true }).first()).toBeVisible();
		// Admin has a seeded 5 MB photo → usage shows a non-zero MB figure
		await expect(page.getByText(/Usage:\s*[1-9]/).first()).toBeVisible();
	});

	test('admin can create a new user', async ({ page }) => {
		await login(page, ADMIN.username, ADMIN.password);
		await page.goto('/settings/admin');
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
		await page.goto('/settings/admin');
		await expect(page).toHaveURL((u) => u.pathname === '/');
	});

	test('admin can set the default theme and it applies to the login screen', async ({ page }) => {
		await login(page, ADMIN.username, ADMIN.password);
		await page.goto('/settings/admin');
		await page.waitForLoadState('networkidle');

		// Pick "Dusk" as the instance default theme (radio inside the Default appearance card).
		// The inputs are sr-only (visually hidden), so force is required.
		await Promise.all([
			page.waitForResponse((r) => r.url().includes('/admin') && r.request().method() === 'POST'),
			page.locator('input[name="themeName"][value="dusk"]').check({ force: true })
		]);

		// The login screen (logged out → global default) now uses the Dusk theme.
		await logout(page);
		await page.goto('/login');
		await page.waitForLoadState('networkidle');
		await expect(page.locator('html')).toHaveAttribute('data-theme', 'dusk');

		// Restore the default to Ocean so it doesn't leak into other specs.
		await login(page, ADMIN.username, ADMIN.password);
		await page.goto('/settings/admin');
		await page.waitForLoadState('networkidle');
		await Promise.all([
			page.waitForResponse((r) => r.url().includes('/admin') && r.request().method() === 'POST'),
			page.locator('input[name="themeName"][value="ocean"]').check({ force: true })
		]);
	});
});
