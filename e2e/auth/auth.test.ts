import { test, expect } from '@playwright/test';
import { login, logout, expectLoggedOutRedirect } from './helpers';
import { ADMIN, BOB } from './fixtures';

test.describe('Auth — login & logout', () => {
	test('unauthenticated request redirects to /login', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveURL((u) => u.pathname === '/login');
	});

	test('logs in by username', async ({ page }) => {
		await login(page, ADMIN.username, ADMIN.password);
		await expect(page).toHaveURL((u) => u.pathname === '/');
	});

	test('logs in by email', async ({ page }) => {
		await login(page, BOB.email, BOB.password);
		await expect(page).toHaveURL((u) => u.pathname === '/');
	});

	test('rejects a wrong password and stays on /login', async ({ page }) => {
		await page.goto('/login');
		await page.locator('#identifier').fill(ADMIN.username);
		await page.locator('#password').fill('wrong-password');
		await page.getByRole('button', { name: 'Sign in' }).click();
		await expect(page).toHaveURL((u) => u.pathname === '/login');
		await expect(page.getByText(/incorrect/i)).toBeVisible();
	});

	test('logout returns to /login and protects routes again', async ({ page }) => {
		await login(page, ADMIN.username, ADMIN.password);
		await logout(page);
		await expect(page).toHaveURL((u) => u.pathname === '/login');
		await expectLoggedOutRedirect(page, '/');
	});

	test('/admin redirects to /login when logged out', async ({ page }) => {
		await expectLoggedOutRedirect(page, '/admin');
	});
});
