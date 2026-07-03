import { test, expect } from '@playwright/test';

test.describe('Demo mode — appearance preview', () => {
	test('color mode preview applies instantly, without saving or showing the demo toast', async ({ page }) => {
		const writes: string[] = [];
		page.on('request', (req) => {
			if (req.url().includes('/settings/appearance') && req.method() === 'POST') writes.push(req.url());
		});

		await page.goto('/settings/appearance');
		await page.waitForLoadState('networkidle');

		const htmlEl = page.locator('html');
		await expect(htmlEl).toHaveAttribute('data-mode', 'dark');

		await page.locator('label').filter({ hasText: /light/i }).click();
		await expect(htmlEl).toHaveAttribute('data-mode', 'light');

		// The global demo write-block toast ("changes won't be saved") must never appear
		// for this interaction — the change never goes near a form submission.
		await expect(page.getByText(/won.?t be saved/i)).toHaveCount(0);
		expect(writes).toHaveLength(0);

		// Nothing was persisted — a hard reload reverts to the server default.
		await page.reload();
		await page.waitForLoadState('networkidle');
		await expect(htmlEl).toHaveAttribute('data-mode', 'dark');
	});

	test('theme preview applies instantly, without saving', async ({ page }) => {
		const writes: string[] = [];
		page.on('request', (req) => {
			if (req.url().includes('/settings/appearance') && req.method() === 'POST') writes.push(req.url());
		});

		await page.goto('/settings/appearance');
		await page.waitForLoadState('networkidle');

		const htmlEl = page.locator('html');
		await expect(htmlEl).toHaveAttribute('data-theme', 'ocean');

		await page.locator('label').filter({ hasText: /forrest/i }).click();
		await expect(htmlEl).toHaveAttribute('data-theme', 'forrest');
		expect(writes).toHaveLength(0);

		await page.reload();
		await page.waitForLoadState('networkidle');
		await expect(htmlEl).toHaveAttribute('data-theme', 'ocean');
	});
});
