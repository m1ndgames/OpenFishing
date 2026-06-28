import { describe, it, expect } from 'vitest';
import { translations, SUPPORTED_LANGS, defaultLang } from '../index';

const enKeys = Object.keys(translations.en).sort();

describe('i18n translations', () => {
	it('defaultLang is in SUPPORTED_LANGS', () => {
		expect(SUPPORTED_LANGS).toContain(defaultLang);
	});

	it('has 9 supported languages', () => {
		expect(SUPPORTED_LANGS).toHaveLength(9);
	});

	for (const lang of SUPPORTED_LANGS) {
		it(`${lang}: has the same keys as English`, () => {
			const keys = Object.keys(translations[lang]).sort();
			expect(keys).toEqual(enKeys);
		});

		it(`${lang}: no key has an empty string value`, () => {
			for (const [key, value] of Object.entries(translations[lang])) {
				if (typeof value === 'string') {
					expect(value, `${lang}.${key} is empty`).not.toBe('');
				}
			}
		});

		it(`${lang}: array values are non-empty arrays`, () => {
			for (const [key, value] of Object.entries(translations[lang])) {
				if (Array.isArray(value)) {
					expect(value.length, `${lang}.${key} is an empty array`).toBeGreaterThan(0);
				}
			}
		});
	}
});
