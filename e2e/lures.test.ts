import { test, expect } from '@playwright/test';
import { LURE_IDS } from './fixtures';

test.describe('Lure overview', () => {
	test('loads the lure grid with seeded lures', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Silver Spinner')).toBeVisible();
		await expect(page.getByText('Gold Jig')).toBeVisible();
	});

	test('shows the lost lure with a LOST badge', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByText('Lost Crankbait')).toBeVisible();
		await expect(page.getByText('LOST').first()).toBeVisible();
	});

	test('favourites filter shows only favourite lures', async ({ page }) => {
		await page.goto('/');
		// networkidle waits for Vite HMR to settle and Svelte to finish hydrating all handlers
		await page.waitForLoadState('networkidle');
		await page.getByRole('button', { name: 'Filters' }).click();
		// Spinner chip only appears when the filter panel is open (confirms Svelte is hydrated)
		await page.getByText('Spinner', { exact: true }).first().waitFor({ state: 'visible', timeout: 5000 });
		// The toggle is icon-only; it is named via aria-label and exposes its state.
		const favourites = page.getByRole('button', { name: 'Favourites', exact: true });
		await expect(favourites).toHaveAttribute('aria-pressed', 'false');
		await favourites.click();
		await expect(favourites).toHaveAttribute('aria-pressed', 'true');
		await expect(page.getByText('Gold Jig')).toBeVisible({ timeout: 5000 });
		await expect(page.getByText('Silver Spinner')).not.toBeVisible({ timeout: 5000 });
	});

	test('grid cards load downscaled WebP thumbnails, not the full photo', async ({ page, request }) => {
		await page.goto('/');
		const img = page.locator('a.of-lure-card', { hasText: 'Gold Jig' }).locator('img').first();
		await expect(img).toHaveAttribute('srcset', '/uploads/seed-lure.png?w=320 320w, /uploads/seed-lure.png?w=640 640w');
		await expect(img).toHaveAttribute('loading', 'lazy');
		// The browser actually picked one of the thumbnails
		await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.currentSrc)).toMatch(/\?w=(320|640)$/);

		const original = await request.get('/uploads/seed-lure.png');
		const thumb = await request.get('/uploads/seed-lure.png?w=320');
		expect(thumb.status()).toBe(200);
		expect(thumb.headers()['content-type']).toBe('image/webp');
		const body = await thumb.body();
		expect(body.subarray(8, 12).toString('ascii')).toBe('WEBP');
		expect(body.length).toBeLessThan((await original.body()).length);
		// Served again from the cache: same bytes
		expect((await (await request.get('/uploads/seed-lure.png?w=320')).body()).equals(body)).toBe(true);
	});

	test('detail photo offers 640/1280 thumbnails, so phones skip the original', async ({ page, request }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto(`/lures/${LURE_IDS[1]}`);
		const img = page.locator('img[alt="Gold Jig"]').first();
		await expect(img).toHaveAttribute(
			'srcset',
			'/uploads/seed-lure.png?w=640 640w, /uploads/seed-lure.png?w=1280 1280w, /uploads/seed-lure.png 1920w'
		);
		await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.currentSrc)).toMatch(/\?w=(640|1280)$/);
		const big = await request.get('/uploads/seed-lure.png?w=1280');
		expect(big.headers()['content-type']).toBe('image/webp');
	});

	test('detail facts sit beside the photo unboxed on desktop, boxed on phones', async ({ page }) => {
		await page.setViewportSize({ width: 1280, height: 900 });
		await page.goto(`/lures/${LURE_IDS[1]}`);
		const info = page.locator('.of-lure-info');
		await expect(info).toHaveCSS('border-top-width', '0px');
		await expect(info).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
		await page.setViewportSize({ width: 390, height: 844 });
		await expect(info).toHaveCSS('border-top-width', '1px');
	});

	test('unknown thumbnail widths fall back to the original', async ({ request }) => {
		const res = await request.get('/uploads/seed-lure.png?w=999');
		expect(res.headers()['content-type']).toBe('image/png');
	});

	test('list view uses the small thumbnail', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.getByRole('button', { name: 'List' }).click();
		await expect(page.locator('a.of-lure-row', { hasText: 'Gold Jig' }).locator('img')).toHaveAttribute('src', '/uploads/seed-lure.png?w=160');
		await page.getByRole('button', { name: 'Tackle box' }).click();
	});

	test('cards show the number plate and how many fish each lure caught', async ({ page }) => {
		await page.goto('/');
		const card = page.locator('a.of-lure-card', { hasText: 'Silver Spinner' });
		// The plate is a small badge on the photo (next to the amount), not a headline in the label
		const badges = card.locator('.of-lure-badges');
		await expect(badges.getByText('#0001')).toBeVisible();
		await expect(badges.getByText('×2')).toBeVisible();
		await expect(card.locator('.of-lure-body')).not.toContainText('#0001');
		await expect(card.locator('.of-lure-caught')).toContainText('1');
		await expect(page.locator('a.of-lure-card', { hasText: 'Lost Crankbait' }).locator('.of-lure-caught')).toHaveCount(0);
	});

	test('list layout is remembered across reloads', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		const list = page.getByRole('button', { name: 'List', exact: true });
		await expect(list).toHaveAttribute('aria-pressed', 'false');
		await list.click();
		await expect(list).toHaveAttribute('aria-pressed', 'true');
		await expect(page.locator('a.of-lure-row')).toHaveCount(3);
		await page.reload();
		await page.waitForLoadState('networkidle');
		await expect(page.locator('a.of-lure-row')).toHaveCount(3);
		// Reset for later tests
		await page.getByRole('button', { name: 'Tackle box' }).click();
		await expect(page.locator('a.of-lure-card').first()).toBeVisible();
	});

	test('type chip-filter includes matching lures', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.getByRole('button', { name: 'Filters' }).click();
		await page.getByText('Spinner', { exact: true }).first().click();
		await expect(page.getByText('Silver Spinner')).toBeVisible();
		await expect(page.getByText('Gold Jig')).not.toBeVisible();
	});
});

test.describe('Lure detail', () => {
	test('shows lure name, brand and type', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}`);
		await expect(page.getByRole('heading', { name: 'Silver Spinner' })).toBeVisible();
		await expect(page.getByText('Mepps')).toBeVisible();
		await expect(page.getByText('Spinner', { exact: true })).toBeVisible();
	});

	test('shows associated tags', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}`);
		await expect(page.getByText('river')).toBeVisible();
		await expect(page.getByText('lake')).toBeVisible();
	});

	test('detail page links to edit', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}`);
		await page.getByRole('link', { name: /edit/i }).click();
		await expect(page).toHaveURL(`/lures/${LURE_IDS[0]}/edit`);
	});
});

test.describe('Lure edit', () => {
	test('edit form is pre-populated with existing values', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}/edit`);
		await expect(page.getByLabel(/name/i)).toHaveValue('Silver Spinner');
		await expect(page.getByLabel(/brand/i)).toHaveValue('Mepps');
	});

	test('can update the lure name and save', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}/edit`);
		// networkidle prevents Vite HMR from resetting input values between fill() and click()
		await page.waitForLoadState('networkidle');
		await page.getByLabel(/name/i).fill('Silver Spinner Updated');
		await page.getByRole('button', { name: 'Save Changes' }).click();
		await expect(page.getByText('Silver Spinner Updated')).toBeVisible();
		// Restore
		await page.goto(`/lures/${LURE_IDS[0]}/edit`);
		await page.waitForLoadState('networkidle');
		await page.getByLabel(/name/i).fill('Silver Spinner');
		await page.getByRole('button', { name: 'Save Changes' }).click();
	});

	test('tag and species fields are labelled', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}/edit`);
		await expect(page.getByLabel('Tags', { exact: true })).toBeVisible();
		await expect(page.getByLabel('Fish Species', { exact: true })).toBeVisible();
	});

	test('Mark as Lost uses the light-mode status tint, not a fixed colour', async ({ page }) => {
		await page.goto(`/lures/${LURE_IDS[0]}/edit`);
		// After hydration, or the layout's $effect resets data-mode.
		await page.waitForLoadState('networkidle');
		await page.evaluate(() => { document.documentElement.dataset.mode = 'light'; });
		const lost = page.getByRole('button', { name: 'Mark as Lost' });
		const tokenBg = await page.evaluate(() => {
			const probe = document.createElement('div');
			probe.style.background = 'var(--of-warning-bg)';
			document.body.appendChild(probe);
			const token = getComputedStyle(probe).backgroundColor;
			probe.remove();
			return token;
		});
		expect(tokenBg).toBe('rgba(180, 83, 9, 0.08)');
		await expect(lost).toHaveCSS('background-color', tokenBg);
	});
});

test.describe('Add new lure', () => {
	test('new lure form renders required fields', async ({ page }) => {
		await page.goto('/lures/new');
		await expect(page.getByLabel(/name/i)).toBeVisible();
		await expect(page.getByLabel(/brand/i)).toBeVisible();
		await expect(page.getByLabel('Type', { exact: true })).toBeVisible();
	});

	test('creates a lure and redirects to detail page', async ({ page }) => {
		await page.goto('/lures/new');
		await page.waitForLoadState('networkidle');
		await page.getByLabel(/name/i).fill('E2E Test Lure');
		await page.getByLabel(/brand/i).fill('TestBrand');
		// Upload photo via the hidden file input (triggers CropModal)
		await page.locator('input[type="file"][accept="image/*"]:not([capture]):not([name])').setInputFiles('e2e/fixtures/test-photo.jpg');
		// Wait for CropperJS to fully initialize — image must load first, so allow extra time in CI
		await page.waitForSelector('cropper-canvas', { state: 'visible', timeout: 30000 });
		// Confirm crop
		await page.getByRole('button', { name: 'Apply' }).click();
		// Wait for photo preview then save
		await expect(page.locator('img[alt="Photo"]')).toBeVisible({ timeout: 15000 });
		await page.getByRole('button', { name: 'Save Lure' }).click();
		await expect(page).toHaveURL(/\/lures\//, { timeout: 15000 });
		await expect(page.getByText('E2E Test Lure')).toBeVisible();
	});

	test('crop window is a keyboard-friendly dialog', async ({ page }) => {
		await page.goto('/lures/new');
		await page.waitForLoadState('networkidle');
		await page.locator('input[type="file"][accept="image/*"]:not([capture]):not([name])').setInputFiles('e2e/fixtures/test-photo.jpg');
		const dialog = page.getByRole('dialog', { name: 'Crop photo' });
		await expect(dialog).toBeVisible({ timeout: 30000 });
		// Focus starts inside the dialog and Tab never leaves it
		await expect(dialog.locator(':focus')).toHaveCount(1);
		for (let i = 0; i < 8; i++) {
			await page.keyboard.press('Tab');
			await expect(dialog.locator(':focus')).toHaveCount(1);
		}
		await page.keyboard.press('Shift+Tab');
		await expect(dialog.locator(':focus')).toHaveCount(1);
		// Escape cancels, like the Cancel button
		await page.keyboard.press('Escape');
		await expect(dialog).toHaveCount(0);
		await expect(page.locator('img[alt="Photo"]')).toHaveCount(0);
	});

	test('crop window speaks the app language', async ({ page, context }) => {
		await context.addCookies([{ name: 'lang', value: 'de', url: 'http://localhost:5174' }]);
		await page.goto('/lures/new');
		await page.waitForLoadState('networkidle');
		await page.locator('input[type="file"][accept="image/*"]:not([capture]):not([name])').setInputFiles('e2e/fixtures/test-photo.jpg');
		const dialog = page.getByRole('dialog', { name: 'Foto zuschneiden' });
		await expect(dialog).toBeVisible({ timeout: 30000 });
		await expect(dialog.getByRole('button', { name: 'Nach links drehen' })).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Übernehmen' })).toBeVisible();
		await expect(dialog.getByRole('button', { name: 'Abbrechen' })).toBeVisible();
	});

	// cropperjs 2's $toCanvas() defaults to the on-screen selection size; CropModal must export
	// at the photo's real resolution, keep 4:3, and never include area outside the photo.
	for (const rotate of [false, true]) {
		test(`crop exports full resolution 4:3 without black bars${rotate ? ' after rotating' : ''}`, async ({ page }) => {
			await page.goto('/lures/new');
			await page.waitForLoadState('networkidle');
			await page.locator('input[type="file"][accept="image/*"]:not([capture]):not([name])').setInputFiles('e2e/fixtures/large-photo.png');
			await page.waitForSelector('cropper-canvas', { state: 'visible', timeout: 30000 });
			if (rotate) await page.getByTitle('Rotate right').click();
			await page.getByRole('button', { name: 'Apply' }).click();

			const preview = page.locator('img[alt="Photo"]');
			await expect(preview).toBeVisible({ timeout: 15000 });
			await expect.poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
			const info = await preview.evaluate((img: HTMLImageElement) => {
				const c = document.createElement('canvas');
				c.width = img.naturalWidth; c.height = img.naturalHeight;
				const ctx = c.getContext('2d')!;
				ctx.drawImage(img, 0, 0);
				const px = (x: number, y: number) => Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
				const w = c.width - 2, h = c.height - 2;
				return { width: img.naturalWidth, height: img.naturalHeight, corners: [px(1, 1), px(w, 1), px(1, h), px(w, h)] };
			});
			// 1600×1200 source at 95% coverage → ~1520 wide unrotated, ~1140 rotated (vs ~500 at screen size)
			expect(info.width).toBeGreaterThan(1000);
			expect(info.width / info.height).toBeCloseTo(4 / 3, 1);
			// Fixture color is rgb(0,128,200); black corners would mean the crop left the photo
			for (const [r, g, b] of info.corners) {
				expect(r).toBeLessThan(40);
				expect(g).toBeGreaterThan(100);
				expect(b).toBeGreaterThan(160);
			}
		});
	}
});

test.describe('Favourite toggle', () => {
	test('toggles favourite via API and reflects in UI', async ({ page }) => {
		const res = await page.request.post(`/api/lures/${LURE_IDS[0]}/favourite`);
		expect(res.status()).toBe(200);
		const json = await res.json();
		expect(typeof json.favourite).toBe('boolean');
		// Restore
		await page.request.post(`/api/lures/${LURE_IDS[0]}/favourite`);
	});
});
