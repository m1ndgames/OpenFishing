import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain-JS runtime helper, outside the SvelteKit tsconfig
import { schemeFromBaseUrl, schemeMismatch } from '../origin.js';

describe('schemeFromBaseUrl', () => {
	it('reads http from a plain-HTTP BASE_URL', () => {
		expect(schemeFromBaseUrl('http://192.168.1.50:3000')).toBe('http');
	});

	it('reads https from an HTTPS BASE_URL', () => {
		expect(schemeFromBaseUrl('https://fishing.example.com')).toBe('https');
	});

	it('ignores path, query and trailing slash', () => {
		expect(schemeFromBaseUrl('http://nas:3000/openfishing/?x=1')).toBe('http');
	});

	it('normalises an uppercase scheme', () => {
		expect(schemeFromBaseUrl('HTTP://nas:3000')).toBe('http');
	});

	it('trims surrounding whitespace', () => {
		expect(schemeFromBaseUrl('  http://nas:3000  ')).toBe('http');
	});

	it('returns null when BASE_URL is unset or blank', () => {
		expect(schemeFromBaseUrl(undefined)).toBeNull();
		expect(schemeFromBaseUrl(null)).toBeNull();
		expect(schemeFromBaseUrl('')).toBeNull();
		expect(schemeFromBaseUrl('   ')).toBeNull();
	});

	it('returns null for a value that is not a URL', () => {
		expect(schemeFromBaseUrl('fishing.example.com')).toBeNull();
		expect(schemeFromBaseUrl('not a url at all')).toBeNull();
	});

	it('returns null for a scheme that cannot serve the app', () => {
		expect(schemeFromBaseUrl('ftp://nas')).toBeNull();
		expect(schemeFromBaseUrl('file:///app')).toBeNull();
	});
});

describe('schemeMismatch', () => {
	it('detects the http-origin / https-belief case from issue #114', () => {
		expect(schemeMismatch('http://192.168.1.50:3000', 'https://192.168.1.50:3000')).toBe(true);
	});

	it('detects the reverse case too', () => {
		expect(schemeMismatch('https://nas:3000', 'http://nas:3000')).toBe(true);
	});

	it('is false when the origins match exactly', () => {
		expect(schemeMismatch('http://nas:3000', 'http://nas:3000')).toBe(false);
	});

	it('is false for a genuine cross-site submission', () => {
		expect(schemeMismatch('https://evil.example.com', 'https://nas:3000')).toBe(false);
		expect(schemeMismatch('http://evil.example.com', 'https://nas:3000')).toBe(false);
	});

	it('is false when only the port differs', () => {
		expect(schemeMismatch('http://nas:3001', 'https://nas:3000')).toBe(false);
	});

	it('normalises default ports away', () => {
		expect(schemeMismatch('http://nas:80', 'https://nas')).toBe(true);
		expect(schemeMismatch('http://nas', 'https://nas:443')).toBe(true);
	});

	it('is false when either side is missing or unparseable', () => {
		expect(schemeMismatch(undefined, 'https://nas')).toBe(false);
		expect(schemeMismatch('http://nas', undefined)).toBe(false);
		expect(schemeMismatch('null', 'https://nas')).toBe(false);
		expect(schemeMismatch(['http://nas', 'http://other'], 'https://nas')).toBe(false);
	});
});
