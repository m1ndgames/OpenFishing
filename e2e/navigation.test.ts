import { test, expect } from '@playwright/test';
import { LURE_IDS, SPOT_IDS } from './fixtures';

test.describe('Navigation', () => {
	test('home page loads', async ({ page }) => {
		await page.goto('/');
		await expect(page).toHaveTitle(/OpenFishing/i);
	});

	test('nav link to Spots works', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /spots/i }).first().click();
		await expect(page).toHaveURL('/spots');
	});

	test('nav link to Catches works', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('link', { name: /catches/i }).first().click();
		await expect(page).toHaveURL('/catches');
	});

	test('stats page loads', async ({ page }) => {
		await page.goto('/stats');
		await expect(page.getByText(/total catches|species|spots fished/i).first()).toBeVisible();
	});

	test('stats: records read in neutral tone, sparse history is explained', async ({ page }) => {
		await page.goto('/stats');
		await page.waitForLoadState('networkidle');
		const record = page.locator('a.of-stat-link').first();
		await expect(record).toBeVisible();
		const bright = await page.evaluate(() => {
			const probe = document.createElement('div');
			probe.style.color = 'var(--of-text-bright)';
			document.body.appendChild(probe);
			const c = getComputedStyle(probe).color;
			probe.remove();
			return c;
		});
		await expect(record).toHaveCSS('color', bright);
		// Either the pattern charts or the note explaining when they appear
		await expect(page.getByText(/appear once you have logged \d+ catches/).or(page.getByText('Time of Day'))).toBeVisible();
	});

	test('QR settings page loads', async ({ page }) => {
		await page.goto('/settings/qr');
		await expect(page).toHaveURL('/settings/qr');
	});

	test('tackle page loads', async ({ page }) => {
		await page.goto('/tackle');
		await expect(page).toHaveURL('/tackle');
	});

	test('settings page loads', async ({ page }) => {
		await page.goto('/settings');
		await expect(page).toHaveURL('/settings');
	});

	test('settings export page loads', async ({ page }) => {
		await page.goto('/settings/export');
		await expect(page).toHaveURL('/settings/export');
	});

	test('appearance settings page loads', async ({ page }) => {
		await page.goto('/settings/appearance');
		await expect(page).toHaveURL('/settings/appearance');
		await expect(page.getByRole('radio', { name: /dark/i })).toBeAttached();
		await expect(page.getByRole('radio', { name: /light/i })).toBeAttached();
		await expect(page.getByRole('radio', { name: /system/i })).toBeAttached();
	});

	test('appearance mode toggle saves and persists selection', async ({ page }) => {
		await page.goto('/settings/appearance');
		await page.waitForLoadState('networkidle');
		const lightLabel = page.locator('label').filter({ hasText: /light/i });
		// Wait for the enhance POST (the DB write) to finish before reloading, otherwise
		// the reload can race ahead of the persisted setting.
		await Promise.all([
			page.waitForResponse((r) => r.url().includes('/settings/appearance') && r.request().method() === 'POST'),
			lightLabel.click()
		]);
		await page.reload();
		await page.waitForLoadState('networkidle');
		const htmlEl = page.locator('html');
		await expect(htmlEl).toHaveAttribute('data-mode', 'light');
	});

	test('settings sub-nav shows Export tab', async ({ page }) => {
		await page.goto('/settings/export');
		await expect(page.getByRole('link', { name: /export/i }).first()).toBeVisible();
	});

	test('export page has date inputs and download link', async ({ page }) => {
		await page.goto('/settings/export');
		await expect(page.locator('input[type="date"]').first()).toBeVisible();
		await expect(page.locator('input[type="date"]').nth(1)).toBeVisible();
		await expect(page.getByRole('link', { name: /csv/i })).toBeVisible();
	});
});

// Pages used to copy `data` once at mount, so a client-side hop to another entry on the
// same route (e.g. a chatbot link from one lure to another) kept showing the first one.
test.describe('Same-route navigation', () => {
	async function hop(page: import('@playwright/test').Page, href: string) {
		await page.waitForLoadState('networkidle');
		await page.evaluate((h) => {
			const a = document.createElement('a');
			a.href = h;
			a.id = 'e2e-hop';
			a.textContent = 'hop';
			document.querySelector('main')!.prepend(a);
		}, href);
		await page.locator('#e2e-hop').click();
		await expect(page).toHaveURL(href);
	}

	test('lure detail follows the new lure', async ({ page }) => {
		await page.goto('/lures/00000000-0000-0000-0000-000000000002');
		await expect(page.locator('h1')).toHaveText('Gold Jig');
		await hop(page, '/lures/00000000-0000-0000-0000-000000000003');
		await expect(page.locator('h1')).toHaveText('Lost Crankbait');
		await expect(page.getByText('#0003')).toBeVisible();
	});

	test('lure edit form refills for the new lure', async ({ page }) => {
		await page.goto('/lures/00000000-0000-0000-0000-000000000002/edit');
		await expect(page.locator('input[name="name"]')).toHaveValue('Gold Jig');
		await hop(page, '/lures/00000000-0000-0000-0000-000000000003/edit');
		await expect(page.locator('input[name="name"]')).toHaveValue('Lost Crankbait');
	});

	test('spot detail follows the new spot', async ({ page }) => {
		await page.goto('/spots/00000000-0000-0000-0000-000000000011');
		await expect(page.locator('h1')).toContainText('Test Lake North');
		await hop(page, '/spots/00000000-0000-0000-0000-000000000012');
		await expect(page.locator('h1')).toContainText('River Bend');
	});
});

test.describe('Share pages', () => {
	test('invalid share token returns 404 or error page', async ({ page }) => {
		const res = await page.goto('/share/lures/invalid-token-xyz');
		expect(res?.status()).toBe(404);
	});
});

test.describe('Form labels', () => {
	test('tackle tabs live in the URL and detail pages return to them', async ({ page }) => {
		await page.goto('/tackle');
		await page.waitForLoadState('networkidle');
		const tabs = page.getByRole('navigation', { name: 'Tackle Bag', exact: true });
		await expect(tabs.getByRole('link', { name: 'Rods' })).toHaveAttribute('aria-current', 'page');
		await expect(page.getByRole('link', { name: /Test Rod/ })).toBeVisible();

		await tabs.getByRole('link', { name: 'Reels' }).click();
		await expect(page).toHaveURL('/tackle?tab=reels');
		await expect(tabs.getByRole('link', { name: 'Reels' })).toHaveAttribute('aria-current', 'page');
		await page.getByRole('link', { name: /Test Reel/ }).click();
		await expect(page).toHaveURL('/tackle/reels/reel-0000-0000-0000-0001');
		await page.locator('a[href="/tackle?tab=reels"]').first().click();
		await expect(page.getByRole('link', { name: /Test Reel/ })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Add Reel' })).toHaveAttribute('href', '/tackle/reels/new');
	});

	test('tackle form labels point at their fields', async ({ page }) => {
		await page.goto('/tackle/rods/new');
		await page.getByText('Brand', { exact: true }).click();
		await expect(page.getByLabel('Brand', { exact: true })).toBeFocused();
		await expect(page.getByLabel(/^Model/)).toHaveAttribute('required', '');
	});

	test('catch export date range is labelled', async ({ page }) => {
		await page.goto('/settings/export');
		await expect(page.getByLabel('From', { exact: true })).toHaveAttribute('type', 'date');
		await expect(page.getByLabel('To', { exact: true })).toHaveAttribute('type', 'date');
	});
});

test.describe('Page structure & accessibility', () => {
	test('each page gets a descriptive document title', async ({ page }) => {
		await page.goto('/catches');
		await expect(page).toHaveTitle('Catches · OpenFishing');
		await page.goto('/lures/00000000-0000-0000-0000-000000000001');
		// Another test may rename this lure; the title follows the current name.
		await expect(page).toHaveTitle(/^Silver Spinner.* · OpenFishing$/);
		await page.goto('/settings/qr');
		await expect(page).toHaveTitle(/· OpenFishing$/);
	});

	test('every section page has exactly one h1', async ({ page }) => {
		for (const path of ['/', '/catches', '/spots', '/stats', '/tackle', '/settings', '/settings/appearance', '/lures/new', '/spots/new', '/catches/new']) {
			await page.goto(path);
			await expect(page.locator('h1'), path).toHaveCount(1);
		}
	});

	test('skip link moves focus to the main content', async ({ page }) => {
		await page.goto('/catches');
		await page.waitForLoadState('networkidle');
		await page.keyboard.press('Tab');
		const skip = page.getByRole('link', { name: 'Skip to content' });
		await expect(skip).toBeFocused();
		await skip.press('Enter');
		await expect(page.locator('main#main')).toBeFocused();
	});

	test('lure filter chips expose include and exclude state', async ({ page }) => {
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		await page.getByRole('button', { name: 'Filters' }).click();
		const chip = page.locator('button.of-chip[data-mode]', { hasText: 'Spinner' }).first();
		await expect(chip).toHaveAttribute('aria-pressed', 'false');
		await chip.click();
		await expect(chip).toHaveAttribute('aria-pressed', 'true');
		await expect(chip).toHaveAttribute('data-mode', 'include');
		await chip.click();
		await expect(chip).toHaveAttribute('data-mode', 'exclude');
		await expect(chip).toHaveAccessibleName(/excluded/);
		await chip.click();
		await expect(chip).toHaveAttribute('aria-pressed', 'false');
	});

	test('list filters and search are labelled', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
		await page.goto('/catches');
		await expect(page.getByRole('combobox', { name: 'Species' })).toBeVisible();
	});

	test('placeholders use the themed tone, not the UA grey', async ({ page }) => {
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		const [ph, token] = await page.evaluate(() => {
			const el = document.querySelector('#species') as HTMLElement;
			const probe = document.createElement('div');
			probe.style.color = 'var(--of-text-4)';
			document.body.appendChild(probe);
			const tok = getComputedStyle(probe).color;
			probe.remove();
			return [getComputedStyle(el, '::placeholder').color, tok];
		});
		expect(ph).toBe(token);
	});
});

test.describe('Copy & chrome', () => {
	test('forms have no footer; list pages keep it', async ({ page }) => {
		await page.goto('/catches/new');
		await expect(page.locator('footer')).toHaveCount(0);
		await page.goto('/catches');
		await expect(page.locator('footer')).toHaveCount(1);
	});

	test('backup and CSV export point at each other', async ({ page }) => {
		await page.goto('/settings');
		await expect(page.getByText(/tackle and photos as one ZIP/)).toBeVisible();
		await page.getByRole('link', { name: /spreadsheet of your catches/ }).click();
		await expect(page).toHaveURL('/settings/export');
		await expect(page.getByRole('link', { name: /not a backup/ })).toHaveAttribute('href', '/settings');
	});

	test('restore file picker can be reached with the keyboard', async ({ page }) => {
		await page.goto('/settings');
		await page.waitForLoadState('networkidle');
		let reached = false;
		for (let i = 0; i < 60 && !reached; i++) {
			await page.keyboard.press('Tab');
			reached = await page.evaluate(() => (document.activeElement as HTMLInputElement | null)?.name === 'backup');
		}
		expect(reached).toBe(true);
		// Focus is drawn on the visible button, since the input itself is visually hidden
		await expect(page.locator('.of-file-pick__btn')).toHaveCSS('outline-style', 'solid');
	});

	test('colour-mode picker uses line icons, not emoji', async ({ page }) => {
		await page.goto('/settings/appearance');
		const text = await page.locator('main').innerText();
		expect(text).not.toMatch(/[\u{1F311}\u{2600}\u{1F4BB}\u{1F1E6}-\u{1F1FF}]/u);
		await expect(page.getByRole('combobox', { name: 'Language' })).toBeVisible();
	});

	test('theme picker spells Forest correctly', async ({ page }) => {
		await page.goto('/settings/appearance');
		await expect(page.getByText('Forest', { exact: true })).toBeVisible();
		await expect(page.getByText('Forrest', { exact: true })).toHaveCount(0);
	});

	test('spot conditions draw the moon phase as an icon', async ({ page }) => {
		await page.goto('/spots/00000000-0000-0000-0000-000000000011');
		const moon = page.getByText('Moon', { exact: true });
		if (await moon.count()) {
			const tile = moon.locator('..');
			await expect(tile.locator('svg path')).toHaveCount(1);
		}
	});

	test('optional catch fields explain themselves', async ({ page }) => {
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		await page.getByText('More details').click();
		await expect(page.getByText('How you worked the lure when the fish took it.')).toBeVisible();
		await expect(page.locator('#combo_id')).toHaveAttribute('aria-describedby', 'combo-hint');
	});
});

test.describe('Hardening', () => {
	test('fonts are self-hosted: no Google Fonts requests', async ({ page }) => {
		const external: string[] = [];
		const local: string[] = [];
		page.on('request', (r) => {
			const url = r.url();
			if (/fonts\.(googleapis|gstatic)\.com/.test(url)) external.push(url);
			if (r.resourceType() === 'font' && new URL(url).pathname.startsWith('/fonts/')) local.push(url);
		});
		await page.goto('/');
		await page.waitForLoadState('networkidle');
		expect(external).toEqual([]);
		expect(local.length).toBeGreaterThan(0);
	});

	test('server-side form errors are announced as alerts', async ({ page }) => {
		await page.goto('/tackle/rods/new');
		await page.waitForLoadState('networkidle');
		// Bypass the browser's own `required` check so the server validation answers.
		await page.locator('#model').evaluate((el) => el.removeAttribute('required'));
		await page.locator('form button[type="submit"]').last().click();
		await expect(page.getByRole('alert')).toBeVisible();
	});

	test('display-only map pins are not tab stops', async ({ page }) => {
		await page.goto(`/spots/${SPOT_IDS[0]}`);
		await page.waitForLoadState('networkidle');
		const pin = page.locator('.leaflet-marker-icon').first();
		await expect(pin).toBeAttached();
		await expect(pin).not.toHaveAttribute('tabindex', '0');
		await expect(pin).not.toHaveClass(/leaflet-interactive/);
	});

	test('map zoom buttons and form examples follow the app language', async ({ page, context }) => {
		await context.addCookies([{ name: 'lang', value: 'de', url: 'http://localhost:5174' }]);
		await page.goto(`/spots/${SPOT_IDS[0]}`);
		await page.waitForLoadState('networkidle');
		await expect(page.getByRole('button', { name: 'Vergrößern' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Verkleinern' })).toBeVisible();
		await expect(page.locator('.leaflet-control-attribution a[title]')).toHaveCount(0);
		await page.goto('/spots/new');
		await expect(page.locator('#name')).toHaveAttribute('placeholder', 'z. B. Bucht an der alten Eiche');
	});

	test('slider rows keep a 44px touch target on phones', async ({ page }) => {
		await page.setViewportSize({ width: 375, height: 800 });
		await page.goto(`/lures/${LURE_IDS[0]}/edit`);
		const range = page.locator('input[type="range"]').first();
		const box = await range.boundingBox();
		expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
	});
});
