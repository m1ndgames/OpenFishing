import { test, expect } from '@playwright/test';
import { LURE_IDS, SPOT_IDS, CATCH_IDS } from './fixtures';

// Phone-width behaviour: the field-use layer in layout.css, the five-tab bar,
// and touch-specific fixes. 375px is the narrowest common phone width.
test.use({ viewport: { width: 375, height: 760 } });

test.describe('Mobile layout', () => {
	test('bottom tab bar has five tabs and Settings lives in the top bar', async ({ page }) => {
		await page.goto('/');
		const tabBar = page.locator('nav').filter({ has: page.locator('.of-tab-label') });
		await expect(tabBar.locator('a')).toHaveCount(5);
		await expect(tabBar.getByRole('link', { name: /settings/i })).toHaveCount(0);

		await page.getByRole('link', { name: 'Settings' }).click();
		await expect(page).toHaveURL('/settings');
	});

	test('tab labels are not clipped in long translations', async ({ page, context }) => {
		await context.addCookies([{ name: 'lang', value: 'fr', url: 'http://localhost:5174' }]);
		await page.goto('/');
		const clipped = await page.locator('nav .of-tab-label').evaluateAll((els) =>
			els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent)
		);
		expect(clipped).toEqual([]);
		await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
	});

	const pages = [
		'/',
		'/catches',
		'/catches/new',
		`/catches/${CATCH_IDS[0]}`,
		`/catches/${CATCH_IDS[0]}/edit`,
		'/spots',
		`/spots/${SPOT_IDS[0]}`,
		'/spots/new',
		`/lures/${LURE_IDS[0]}`,
		'/lures/new',
		`/lures/${LURE_IDS[0]}/edit`,
		'/tackle',
		'/tackle/rods/new',
		'/stats',
		'/settings'
	];

	for (const path of pages) {
		test(`no horizontal page scroll on ${path}`, async ({ page }) => {
			await page.goto(path);
			await page.waitForLoadState('networkidle');
			const overflow = await page.evaluate(
				() => document.documentElement.scrollWidth - document.documentElement.clientWidth
			);
			expect(overflow).toBeLessThanOrEqual(0);
		});
	}

	test('form fields use 16px text so iOS does not zoom on focus', async ({ page }) => {
		await page.goto('/catches/new');
		const sizes = await page
			.locator('main input[type="text"], main input[type="number"], main select, main textarea')
			.evaluateAll((els) => els.map((el) => getComputedStyle(el).fontSize));
		expect(sizes.length).toBeGreaterThan(0);
		for (const size of sizes) expect(size).toBe('16px');
	});

	test('catch form save button is reachable without scrolling', async ({ page }) => {
		await page.goto('/catches/new');
		const save = page.getByRole('button', { name: 'Log Catch' });
		await expect(save).toBeInViewport();
		const box = await save.boundingBox();
		expect(box!.height).toBeGreaterThanOrEqual(48);
	});

	test('maps keep one-finger dragging on non-touch devices', async ({ page }) => {
		await page.goto('/spots/new');
		await page.waitForLoadState('networkidle');
		const map = page.locator('.leaflet-container');
		await expect(map).toHaveClass(/leaflet-grab/);
		await expect(page.locator('.of-map-hint')).toHaveCount(0);
		await expect(page.getByText('Click on the map to pin the spot')).toBeVisible();
		await expect(page.getByText('Tap the map to pin the spot')).toBeHidden();
	});

	test('tag input commits a tag on typed space without a keydown event', async ({ page }) => {
		// Android keyboards report space as "Unidentified" on keydown; insertText
		// fires only the input event, like those keyboards do.
		await page.goto('/lures/new');
		// Hydration must finish first, or the text lands in an input with no handlers.
		await page.waitForLoadState('networkidle');
		const tagField = page.locator('input[name="tags"] + div input[type="text"]');
		await tagField.click();
		await page.keyboard.insertText('river ');
		await expect(page.locator('input[name="tags"]')).toHaveValue('river');
		await expect(page.getByRole('button', { name: /river/i })).toBeVisible();
	});
});

// Touch devices: a one-finger drag over a map scrolls the page (no scroll trap),
// two fingers move the map, and a tap still places the marker.
test.describe('Map touch gestures', () => {
	test.use({ viewport: { width: 375, height: 760 }, hasTouch: true, isMobile: true });

	// Scrolls the map to the middle of the viewport (clear of the sticky save bar
	// and the tab bar) and returns a point that is verifiably on the map.
	async function centerOnMap(map: import('@playwright/test').Locator) {
		await map.evaluate((el) => el.scrollIntoView({ block: 'center' }));
		const box = (await map.boundingBox())!;
		const x = box.x + box.width / 2;
		const y = box.y + box.height / 2;
		const onMap = await map.evaluate((el, p) => el.contains(document.elementFromPoint(p.x, p.y)), { x, y });
		expect(onMap).toBe(true);
		return { x, y };
	}

	test('one-finger dragging is off and the map lets the browser scroll', async ({ page }) => {
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		const map = page.locator('.leaflet-container');
		await expect(map).not.toHaveClass(/leaflet-touch-drag/);
		await expect(map).toHaveCSS('touch-action', 'pan-x pan-y');
	});

	test('one-finger touches on the map are not cancelled, so the page can scroll', async ({ page }) => {
		// Scrolling over the map can only be blocked by CSS touch-action (checked above)
		// or by a script calling preventDefault() on the touch events. With dragging
		// enabled Leaflet cancels them; with two-finger mode nothing may. (A real
		// synthesized touch scroll does not move the page in headless Chromium even
		// on plain content, so the gesture itself is not testable here.)
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		const map = page.locator('.leaflet-container');
		const { x, y } = await centerOnMap(map);
		const cancelled = await map.evaluate((el, p) => {
			const fire = (type: string, cy: number) => {
				const t = new Touch({ identifier: 7, target: el, clientX: p.x, clientY: cy });
				const ev = new TouchEvent(type, { touches: type === 'touchend' ? [] : [t], changedTouches: [t], bubbles: true, cancelable: true });
				el.dispatchEvent(ev);
				return ev.defaultPrevented;
			};
			return [fire('touchstart', p.y), fire('touchmove', p.y - 40), fire('touchmove', p.y - 120)];
		}, { x, y });
		expect(cancelled).toEqual([false, false, false]);
	});

	test('a one-finger drag shows the two-finger hint, which then fades', async ({ page }) => {
		await page.goto('/spots/new');
		await page.waitForLoadState('networkidle');
		const hint = page.locator('.of-map-hint');
		await expect(hint).toHaveText('Use two fingers to move the map');
		await expect(hint).not.toHaveClass(/of-map-hint--on/);

		await page.locator('.leaflet-container').evaluate((el) => {
			const r = el.getBoundingClientRect();
			const t = new Touch({ identifier: 1, target: el, clientX: r.x + 50, clientY: r.y + 50 });
			el.dispatchEvent(new TouchEvent('touchmove', { touches: [t], bubbles: true }));
		});
		await expect(hint).toHaveClass(/of-map-hint--on/);
		await expect(hint).not.toHaveClass(/of-map-hint--on/, { timeout: 3000 });
	});

	test('the map caption says tap, not click, on touch screens', async ({ page }) => {
		await page.goto('/spots/new');
		await expect(page.getByText('Tap the map to pin the spot')).toBeVisible();
		await expect(page.getByText('Click on the map to pin the spot')).toBeHidden();
	});

	test('tapping the map still places the marker', async ({ page }) => {
		await page.goto('/catches/new');
		await page.waitForLoadState('networkidle');
		const { x, y } = await centerOnMap(page.locator('.leaflet-container'));
		await page.touchscreen.tap(x, y);
		await expect(page.locator('input[name="lat"]')).not.toHaveValue('');
	});
});

test.describe('Touch sizing & form chrome', () => {
	test.use({ viewport: { width: 375, height: 760 }, hasTouch: true, isMobile: true });

	test('map zoom buttons meet the 44px touch floor', async ({ page }) => {
		await page.goto('/spots/00000000-0000-0000-0000-000000000011');
		await page.waitForLoadState('networkidle');
		const zoomIn = page.locator('.leaflet-control-zoom-in');
		await expect(zoomIn).toBeVisible();
		const box = (await zoomIn.boundingBox())!;
		expect(box.height).toBeGreaterThanOrEqual(44);
		expect(box.width).toBeGreaterThanOrEqual(44);
	});

	test('length and weight stay side by side on a phone', async ({ page }) => {
		await page.goto('/catches/new');
		const len = (await page.locator('#length_cm').boundingBox())!;
		const wt = (await page.locator('#weight_g').boundingBox())!;
		expect(Math.abs(len.y - wt.y)).toBeLessThan(2);
	});
});
