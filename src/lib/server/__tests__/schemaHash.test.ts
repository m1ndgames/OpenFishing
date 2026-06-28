import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { getSchemaHash } from '../db/schema-hash';

function makeDb(extraLureCol = '', extraTagCol = '') {
	const db = new Database(':memory:');
	db.exec(`
		CREATE TABLE lure (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL
			${extraLureCol ? `, ${extraLureCol}` : ''}
		);
		CREATE TABLE tag (
			id INTEGER PRIMARY KEY,
			name TEXT NOT NULL
			${extraTagCol ? `, ${extraTagCol}` : ''}
		);
	`);
	return db;
}

describe('getSchemaHash', () => {
	it('returns a 64-character hex string', () => {
		const hash = getSchemaHash(makeDb());
		expect(hash).toMatch(/^[0-9a-f]{64}$/);
	});

	it('returns the same hash for identical schemas', () => {
		expect(getSchemaHash(makeDb())).toBe(getSchemaHash(makeDb()));
	});

	it('returns a different hash when a column is added to lure', () => {
		const h1 = getSchemaHash(makeDb());
		const h2 = getSchemaHash(makeDb('colour TEXT'));
		expect(h1).not.toBe(h2);
	});

	it('returns a different hash when a column is added to tag', () => {
		const h1 = getSchemaHash(makeDb());
		const h2 = getSchemaHash(makeDb('', 'sortOrder INTEGER'));
		expect(h1).not.toBe(h2);
	});

	it('is insensitive to column declaration order', () => {
		const db1 = new Database(':memory:');
		db1.exec(`
			CREATE TABLE lure (id TEXT PRIMARY KEY, name TEXT NOT NULL, brand TEXT);
			CREATE TABLE tag  (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
		`);
		const db2 = new Database(':memory:');
		db2.exec(`
			CREATE TABLE lure (brand TEXT, id TEXT PRIMARY KEY, name TEXT NOT NULL);
			CREATE TABLE tag  (id INTEGER PRIMARY KEY, name TEXT NOT NULL);
		`);
		expect(getSchemaHash(db1)).toBe(getSchemaHash(db2));
	});
});
