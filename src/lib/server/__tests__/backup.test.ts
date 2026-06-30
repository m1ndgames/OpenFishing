import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// A real in-memory SQLite DB with the full schema, shared with the module under test.
vi.mock('$env/dynamic/private', () => ({ env: { UPLOAD_PATH: mkdtempSync(join(tmpdir(), 'of-backup-')) } }));
vi.mock('$lib/server/db', async () => {
	const Database = (await import('better-sqlite3')).default;
	const { drizzle } = await import('drizzle-orm/better-sqlite3');
	const { migrate } = await import('drizzle-orm/better-sqlite3/migrator');
	const schema = await import('../db/schema');
	const client = new Database(':memory:');
	const db = drizzle(client, { schema });
	migrate(db, { migrationsFolder: 'drizzle' });
	return { db, client };
});

import * as s from '../db/schema';
const { db, client } = await import('$lib/server/db');
const { buildBackup, packBackupZip, parseBackupZip, restoreUserBackup, restoreAllBackup, BackupError } = await import('../backup');
const ctx = { client } as any;

const userA = 'user-a';
const userB = 'user-b';

function reset() {
	for (const t of ['catch_photo', 'fish_catch', 'spot_photo', 'spot_tag', 'spot', 'tag', 'lure', 'reel_line_log', 'combo', 'rod', 'reel', 'fishing_line', 'user_setting', 'user']) {
		ctx.client.prepare(`DELETE FROM ${t}`).run();
	}
}

function seed() {
	db.insert(s.user).values([
		{ id: userA, email: 'a@x.com', username: 'alice', passwordHash: 'h', isAdmin: true },
		{ id: userB, email: 'b@x.com', username: 'bob', passwordHash: 'h' }
	]).run();
	db.insert(s.lure).values([
		{ id: 'la1', userId: userA, name: 'A Spinner', lureNumber: 1 },
		{ id: 'lb1', userId: userB, name: 'B Crank', lureNumber: 1 }
	]).run();
	db.insert(s.tag).values([{ id: 'ta1', lureId: 'la1', name: 'river' }]).run();
	db.insert(s.spot).values([{ id: 'sa1', userId: userA, name: 'A Lake', lat: 1, lng: 2 }]).run();
	db.insert(s.fishCatch).values([{ id: 'ca1', userId: userA, species: 'Pike', caughtAt: new Date() }]).run();
	db.insert(s.rod).values([{ id: 'ra1', userId: userA, model: 'A Rod' }]).run();
	db.insert(s.reel).values([{ id: 're1', userId: userA, model: 'A Reel' }]).run();
}

beforeEach(() => { reset(); seed(); });

describe('buildBackup', () => {
	it('scopes a user backup to that user only', () => {
		const p = buildBackup('user', userA);
		expect(p.meta.scope).toBe('user');
		expect(p.users).toBeUndefined();
		expect(p.lures.map((l) => l.id)).toEqual(['la1']);
		expect(p.tags).toHaveLength(1);
		expect(p.spots).toHaveLength(1);
		expect(p.catches).toHaveLength(1);
		expect(p.rods).toHaveLength(1);
		expect(p.reels).toHaveLength(1);
	});

	it('includes all users and all data for an all-backup', () => {
		const p = buildBackup('all', null);
		expect(p.meta.scope).toBe('all');
		expect(p.users).toHaveLength(2);
		expect(p.lures).toHaveLength(2);
	});
});

describe('restoreUserBackup', () => {
	it("replaces only the importing user's data, leaving others untouched", () => {
		const backupA = buildBackup('user', userA);
		// Mutate A's live data, then restore from the backup.
		ctx.client.prepare("UPDATE lure SET name = 'CHANGED' WHERE id = 'la1'").run();
		restoreUserBackup(backupA, userA);

		const aLures = ctx.client.prepare('SELECT name FROM lure WHERE user_id = ?').all(userA);
		expect(aLures).toEqual([{ name: 'A Spinner' }]); // restored
		const bLures = ctx.client.prepare('SELECT id FROM lure WHERE user_id = ?').all(userB);
		expect(bLures).toEqual([{ id: 'lb1' }]); // untouched
	});

	it('preserves full fidelity through a zip round-trip', () => {
		ctx.client.prepare("UPDATE lure SET favourite = 1, amount = 5 WHERE id = 'la1'").run();
		const p = buildBackup('user', userA);
		const zip = packBackupZip(p);
		const { payload } = parseBackupZip(Buffer.from(zip), 'user');
		restoreUserBackup(payload, userA);
		const row = ctx.client.prepare("SELECT favourite, amount FROM lure WHERE id = 'la1'").get() as any;
		expect(row.favourite).toBe(1);
		expect(row.amount).toBe(5);
	});
});

describe('restoreAllBackup', () => {
	it('wipes and rebuilds every user and their data', () => {
		const all = buildBackup('all', null);
		reset(); // simulate a fresh/empty instance
		restoreAllBackup(all);
		expect(ctx.client.prepare('SELECT COUNT(*) c FROM user').get()).toMatchObject({ c: 2 });
		expect(ctx.client.prepare('SELECT COUNT(*) c FROM lure').get()).toMatchObject({ c: 2 });
		expect(ctx.client.prepare('SELECT user_id FROM lure WHERE id = ?').get('lb1')).toMatchObject({ user_id: userB });
	});
});

describe('parseBackupZip validation', () => {
	it('rejects a user backup fed into the all-restore path', () => {
		const zip = packBackupZip(buildBackup('user', userA));
		expect(() => parseBackupZip(Buffer.from(zip), 'all')).toThrow(BackupError);
	});

	it('rejects an all backup fed into the user-restore path', () => {
		const zip = packBackupZip(buildBackup('all', null));
		expect(() => parseBackupZip(Buffer.from(zip), 'user')).toThrow(BackupError);
	});

	it('rejects a non-zip buffer', () => {
		expect(() => parseBackupZip(Buffer.from('not a zip'), 'user')).toThrow(BackupError);
	});
});
