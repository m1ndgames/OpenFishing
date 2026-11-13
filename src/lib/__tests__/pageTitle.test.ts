import { describe, it, expect } from 'vitest';
import { pageTitle, pageTitlePart } from '../pageTitle';
import en from '../i18n/en';

const t = en as unknown as Record<string, unknown>;

describe('pageTitle', () => {
	it('names the section pages', () => {
		expect(pageTitle('/', t)).toBe('Lures · OpenFishing');
		expect(pageTitle('/spots', t)).toBe('Spots · OpenFishing');
		expect(pageTitle('/catches/', t)).toBe('Catches · OpenFishing');
		expect(pageTitle('/stats', t)).toBe(`${en.statsTitle} · OpenFishing`);
		expect(pageTitle('/tackle', t)).toBe(`${en.tackleTitle} · OpenFishing`);
	});

	it('uses the entity name on detail pages', () => {
		expect(pageTitle('/lures/abc', t, { lure: { name: 'Silver Spinner' } })).toBe('Silver Spinner · OpenFishing');
		expect(pageTitle('/spots/abc', t, { spot: { name: 'Test Lake' } })).toBe('Test Lake · OpenFishing');
		expect(pageTitle('/catches/abc', t, { catch: { species: 'Pike' } })).toBe('Pike · OpenFishing');
		expect(pageTitle('/tackle/rods/abc', t, { rod: { brand: 'Shimano', model: 'Zodias' } })).toBe('Shimano Zodias · OpenFishing');
		expect(pageTitle('/tackle/combos/abc', t, { combo: { name: 'Pike setup' } })).toBe('Pike setup · OpenFishing');
	});

	it('falls back to the section when the entity has no name', () => {
		expect(pageTitlePart('/catches/abc', t, { catch: { species: null } })).toBe('Catches');
		expect(pageTitlePart('/tackle/reels/abc', t, {})).toBe(en.tackleTitle);
	});

	it('names add and edit forms', () => {
		expect(pageTitlePart('/lures/new', t)).toBe(en.addLureTitle);
		expect(pageTitlePart('/lures/x/edit', t)).toBe(en.editLureTitle);
		expect(pageTitlePart('/spots/new', t)).toBe(en.addSpot);
		expect(pageTitlePart('/catches/new', t)).toBe(en.catchNewTitle);
		expect(pageTitlePart('/catches/x/edit', t)).toBe(en.catchEditTitle);
		expect(pageTitlePart('/tackle/lines/new', t)).toBe(en.lineAddTitle);
		expect(pageTitlePart('/tackle/reels/x/edit', t)).toBe(en.reelEditTitle);
	});

	it('names settings tabs', () => {
		expect(pageTitlePart('/settings', t)).toBe(en.navSettings);
		expect(pageTitlePart('/settings/qr', t)).toBe(en.qrCodesTitle);
		expect(pageTitlePart('/settings/account', t)).toBe(en.accountTitle);
		expect(pageTitlePart('/settings/unknown', t)).toBe(en.navSettings);
	});

	it('bare app name for unknown routes', () => {
		expect(pageTitle('/nowhere', t)).toBe('OpenFishing');
	});
});
