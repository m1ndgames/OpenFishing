import { test, expect } from '@playwright/test';
import { login } from './helpers';
import { ADMIN, BOB, ADMIN_LURE, BOB_LURE, ADMIN_SPOT, BOB_SPOT } from './fixtures';

test.describe('Data isolation between users', () => {
	test('admin sees only their own lures and spots', async ({ page }) => {
		await login(page, ADMIN.username, ADMIN.password);
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText(ADMIN_LURE.name)).toBeVisible();
		await expect(page.getByText(BOB_LURE.name)).toHaveCount(0);

		await page.goto('/spots');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText(ADMIN_SPOT.name)).toBeVisible();
		await expect(page.getByText(BOB_SPOT.name)).toHaveCount(0);
	});

	test('bob sees only their own lures and spots', async ({ page }) => {
		await login(page, BOB.email, BOB.password);
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText(BOB_LURE.name)).toBeVisible();
		await expect(page.getByText(ADMIN_LURE.name)).toHaveCount(0);

		await page.goto('/spots');
		await page.waitForLoadState('networkidle');
		await expect(page.getByText(BOB_SPOT.name)).toBeVisible();
		await expect(page.getByText(ADMIN_SPOT.name)).toHaveCount(0);
	});

	test("bob cannot open admin's lure detail (404)", async ({ page }) => {
		await login(page, BOB.email, BOB.password);
		const res = await page.goto(`/lures/${ADMIN_LURE.id}`);
		expect(res?.status()).toBe(404);
	});

	test('admin can open their own lure detail', async ({ page }) => {
		await login(page, ADMIN.username, ADMIN.password);
		const res = await page.goto(`/lures/${ADMIN_LURE.id}`);
		expect(res?.status()).toBe(200);
		await expect(page.getByText(ADMIN_LURE.name).first()).toBeVisible();
	});
});
