import { test, expect } from '@playwright/test';
import { login, logout } from './helpers';
import { ADMIN } from './fixtures';

// End-to-end proof that a regular user can change their own password. Uses a dedicated
// user (created via the admin UI) so it never disturbs the shared `bob` fixture.
test.describe('Regular user password change', () => {
	test('changes password, is logged out, and can log in with the new one', async ({ page }) => {
		// 1. Admin creates the user.
		await login(page, ADMIN.username, ADMIN.password);
		await page.goto('/settings/admin');
		await page.waitForLoadState('networkidle');
		await page.locator('#c_email').fill('pwuser@example.com');
		await page.locator('#c_username').fill('pwuser');
		await page.locator('#c_password').fill('oldpass123');
		await Promise.all([
			page.waitForResponse((r) => r.url().includes('/admin') && r.request().method() === 'POST'),
			page.getByRole('button', { name: 'Create', exact: true }).click()
		]);
		await logout(page);

		// 2. The user logs in and changes their password.
		await login(page, 'pwuser', 'oldpass123');
		await page.goto('/settings/account');
		await page.waitForLoadState('networkidle');
		await page.locator('#cur').fill('oldpass123');
		await page.locator('#new').fill('newpass456');
		await Promise.all([
			page.waitForURL('**/login'), // password change forces re-login
			page.getByRole('button', { name: 'Update password' }).click()
		]);
		await expect(page).toHaveURL((u) => u.pathname === '/login');

		// 3. The new password works (and proves the change persisted).
		await login(page, 'pwuser', 'newpass456');
		await expect(page).toHaveURL((u) => u.pathname === '/');
	});
});
