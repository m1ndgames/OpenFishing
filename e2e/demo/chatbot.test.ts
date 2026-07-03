import { test, expect } from '@playwright/test';

test.describe('Demo mode — chatbot', () => {
	test('widget is visible even though CHATBOT is unset, and replies with a canned message without contacting the server', async ({ page }) => {
		const chatPosts: string[] = [];
		page.on('request', (req) => {
			if (req.url().includes('/api/chat') && req.method() === 'POST') chatPosts.push(req.url());
		});

		await page.goto('/');
		await page.waitForLoadState('networkidle');

		const fab = page.getByLabel('Open fishing buddy chat');
		await expect(fab).toBeVisible();
		await fab.click();

		const textarea = page.getByPlaceholder('Ask anything…');
		await expect(textarea).toBeVisible();
		await textarea.fill('Hello');
		await textarea.press('Enter');

		await expect(page.getByText('The AI chatbot is disabled in this demo.')).toBeVisible();
		expect(chatPosts).toHaveLength(0);
	});
});
