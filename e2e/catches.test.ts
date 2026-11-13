import { test, expect } from '@playwright/test';
import { CATCH_IDS, LURE_IDS } from './fixtures';

test.describe('Catches list', () => {
	test('shows seeded catches', async ({ page }) => {
		await page.goto('/catches');
		// Use link role to avoid matching "Pike" in filter dropdowns
		await expect(page.locator('a').filter({ hasText: 'Pike' }).first()).toBeVisible();
		await expect(page.locator('a').filter({ hasText: 'Perch' }).first()).toBeVisible();
	});

	test('links to catch detail', async ({ page }) => {
		await page.goto('/catches');
		await page.locator('a').filter({ hasText: 'Pike' }).first().click();
		await expect(page).toHaveURL(`/catches/${CATCH_IDS[0]}`);
	});
});

test.describe('Catch detail', () => {
	test('shows species, weight and length', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByRole('heading', { level: 1, name: 'Pike' })).toBeVisible();
		await expect(page.getByText('1800')).toBeVisible();
		await expect(page.getByText('62')).toBeVisible();
	});

	test('shows linked lure', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByText('Silver Spinner')).toBeVisible();
	});

	test('shows nearby spot link', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByText('Test Lake North')).toBeVisible();
	});

	test('shows bite index', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByText('7.5')).toBeVisible();
	});

	test('links to edit page', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await page.getByRole('link', { name: /edit/i }).click();
		await expect(page).toHaveURL(`/catches/${CATCH_IDS[0]}/edit`);
	});

	test('shows which fish it was on the lure', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByTestId('catch-lure-n')).toHaveText('First fish on this lure');
	});

	test('counts later fish on the same lure', async ({ page }) => {
		// Gold Jig: the seeded Pike (3 days ago) came first, the Perch (yesterday) second
		await page.goto(`/catches/${CATCH_IDS[1]}`);
		await expect(page.getByTestId('catch-lure-n')).toHaveText('Fish no. 2 on this lure');
	});

	test('flags a personal best only on the bigger fish', async ({ page }) => {
		// Two seeded Pike: 62 cm (this one) and 48 cm
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByTestId('catch-pb')).toHaveText('Longest Pike yet');
		await page.goto(`/catches/${CATCH_IDS[2]}`);
		await expect(page.getByRole('heading', { level: 1, name: 'Pike' })).toBeVisible();
		await expect(page.getByTestId('catch-pb')).toHaveCount(0);
	});

	test('has a back link to the catch list', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await page.waitForLoadState('networkidle');
		await page.getByRole('link', { name: 'Catches', exact: true }).first().click();
		await expect(page).toHaveURL('/catches');
	});

	test('no saved banner on a normal visit', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}`);
		await expect(page.getByText('Catch logged')).toHaveCount(0);
	});
});

test.describe('Add new catch', () => {
	test('new catch form renders with species and lure fields', async ({ page }) => {
		await page.goto('/catches/new');
		await expect(page.getByLabel(/species/i)).toBeVisible();
	});

	test('creates a catch and redirects to detail', async ({ page, context }) => {
		// The catch form requires lat/lng — use geolocation mock and the locate button
		await context.grantPermissions(['geolocation']);
		await context.setGeolocation({ latitude: 52.52, longitude: 13.40 });
		await page.goto('/catches/new');
		// networkidle ensures HMR is settled before geolocation interaction
		await page.waitForLoadState('networkidle');
		await page.getByLabel(/species/i).fill('Zander');
		await page.getByRole('button', { name: 'Use my location' }).click();
		// Wait for Svelte state to update the hidden lat input
		await page.waitForFunction(
			() => (document.querySelector('input[name="lat"]') as HTMLInputElement)?.value !== '',
			null,
			{ timeout: 15000 }
		);
		await page.getByRole('button', { name: 'Log Catch' }).click();
		await expect(page.getByRole('heading', { level: 1, name: 'Zander' })).toBeVisible();
		await expect(page).toHaveURL(/\/catches\//);

		// Confirmation with a shortcut to the next catch; the query is dropped from the URL.
		const banner = page.getByRole('status').filter({ hasText: 'Catch logged' });
		await expect(banner).toBeVisible();
		await expect(page).toHaveURL(/\/catches\/[0-9a-f-]{36}$/);
		await banner.getByRole('link', { name: /Log another/ }).click();
		await expect(page).toHaveURL('/catches/new');
	});

	test('fills location and time from the photo EXIF and saves (#37)', async ({ page, context }) => {
		await context.clearPermissions();
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		await page.locator('input[type="file"][name="photos"]').setInputFiles('e2e/fixtures/gps-photo.jpg');

		await expect(page.locator('input[name="lat"]')).toHaveValue(/^52\.5/, { timeout: 10000 });
		await expect(page.locator('input[name="lng"]')).toHaveValue(/^13\.40/);
		await expect(page.getByText('Location taken from photo')).toBeVisible();
		await expect(page.locator('#caught_at')).toHaveValue('2026-06-15T07:30');
		await expect(page.getByText('Time taken from photo')).toBeVisible();

		// The EXIF-tagged JPEG goes through the normal upload path
		await page.getByLabel(/species/i).fill('Perch');
		await page.getByRole('button', { name: 'Log Catch' }).click();
		await expect(page).toHaveURL(/\/catches\/[0-9a-f-]{36}(\?saved=1)?$/);
		await expect(page.getByRole('heading', { level: 1, name: 'Perch' })).toBeVisible();
	});

	test('photo time does not override a date the user entered but can be applied (#37)', async ({ page, context }) => {
		await context.clearPermissions();
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		await page.locator('#caught_at').fill('2026-01-01T10:00');
		await page.locator('input[type="file"][name="photos"]').setInputFiles('e2e/fixtures/gps-photo.jpg');

		const usePhotoTime = page.getByRole('button', { name: 'Use photo time' });
		await expect(usePhotoTime).toBeVisible({ timeout: 10000 });
		await expect(page.locator('#caught_at')).toHaveValue('2026-01-01T10:00');

		await usePhotoTime.click();
		await expect(page.locator('#caught_at')).toHaveValue('2026-06-15T07:30');
		await expect(usePhotoTime).toBeHidden();
	});

	test('retrieve style chips and Catch & Release announce their pressed state', async ({ page }) => {
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		await page.getByText('More details').click();
		const group = page.getByRole('group', { name: 'Retrieve Style' });
		const chip = group.getByRole('button', { name: 'Twitching' });
		await expect(chip).toHaveAttribute('aria-pressed', 'false');
		await chip.click();
		await expect(chip).toHaveAttribute('aria-pressed', 'true');
		await expect(page.locator('input[name="presentation"]')).toHaveValue('Twitching');

		const release = page.getByRole('button', { name: 'Catch & Release' });
		await expect(release).toHaveAttribute('aria-pressed', 'false');
		await release.click();
		await expect(release).toHaveAttribute('aria-pressed', 'true');
	});

	test('selected chips use the active theme accent, not a fixed colour', async ({ page }) => {
		await page.goto('/catches/new');
		// After hydration, or the layout's $effect resets data-theme.
		await page.waitForLoadState('networkidle');
		await page.evaluate(() => { document.documentElement.dataset.theme = 'forrest'; });
		await page.getByText('More details').click();
		const chip = page.getByRole('group', { name: 'Retrieve Style' }).getByRole('button').first();
		await chip.click();
		await expect(chip).toHaveAttribute('aria-pressed', 'true');
		const tokenBg = await page.evaluate(() => {
			const probe = document.createElement('div');
			probe.style.background = 'var(--of-accent-bg-hover)';
			document.body.appendChild(probe);
			const token = getComputedStyle(probe).backgroundColor;
			probe.remove();
			return token;
		});
		expect(tokenBg).not.toBe('rgba(6, 182, 212, 0.14)'); // Forrest is not Ocean
		// Polls past the chip's colour transition.
		await expect(chip).toHaveCSS('background-color', tokenBg);
	});

	test('optional fields sit behind More details', async ({ page }) => {
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		const retrieve = page.getByRole('group', { name: 'Retrieve Style' });
		await expect(retrieve).toBeHidden();
		await page.getByText('More details').click();
		await expect(retrieve).toBeVisible();
		await expect(page.getByRole('button', { name: 'Catch & Release' })).toBeVisible();
	});

	test('lure tiles pick a recent lure and sync the full list', async ({ page }) => {
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		const tiles = page.getByRole('group', { name: 'Recent & favourite lures' });
		const tile = tiles.getByRole('button', { name: /Silver Spinner/ });
		await expect(tile).toHaveAttribute('aria-pressed', 'false');
		await tile.click();
		await expect(tile).toHaveAttribute('aria-pressed', 'true');
		await expect(page.locator('select[name="lure_id"]')).toHaveValue(LURE_IDS[0]);
		// Tapping again clears it
		await tile.click();
		await expect(page.locator('select[name="lure_id"]')).toHaveValue('');
	});

	test('a saved spot places the location pin', async ({ page, context }) => {
		await context.clearPermissions();
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		await page.getByRole('combobox', { name: 'Use a saved spot' }).selectOption({ label: 'Test Lake North' });
		await expect(page.locator('input[name="lat"]')).not.toHaveValue('');
		await expect(page.locator('input[name="lng"]')).not.toHaveValue('');
	});

	test('edit form opens More details when optional fields are set', async ({ page }) => {
		await page.goto(`/catches/${CATCH_IDS[0]}/edit`);
		await page.waitForLoadState('networkidle');
		await expect(page.locator('details.of-more')).toHaveAttribute('open', '');
	});
});
