import { type Page, expect } from '@playwright/test';

/** Log in via the identifier/password form and wait for the redirect to home. */
export async function login(page: Page, identifier: string, password: string) {
	await page.goto('/login');
	await page.locator('#identifier').fill(identifier);
	await page.locator('#password').fill(password);
	await Promise.all([
		page.waitForURL((u) => u.pathname === '/'),
		page.getByRole('button', { name: 'Sign in' }).click()
	]);
}

/** Log out from the Account settings page, waiting for the redirect to /login. */
export async function logout(page: Page) {
	await page.goto('/settings/account');
	await page.waitForLoadState('networkidle');
	await Promise.all([
		page.waitForURL('**/login'),
		page.getByRole('button', { name: /log out/i }).click()
	]);
}

export async function expectLoggedOutRedirect(page: Page, path: string) {
	await page.goto(path);
	await expect(page).toHaveURL((u) => u.pathname === '/login');
}
