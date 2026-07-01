import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { randomBytes, scryptSync } from 'node:crypto';
import { join } from 'node:path';
import * as schema from '../../src/lib/server/db/schema';
import { ADMIN, BOB, ADMIN_LURE, BOB_LURE, ADMIN_SPOT, BOB_SPOT, ADMIN_PHOTO } from './fixtures';

const DB_PATH = 'e2e/test-auth.db';
const UPLOAD_DIR = 'e2e/uploads-auth';

// Mirror src/lib/server/auth.ts hashPassword: scrypt(password, 16-byte salt, 64) -> "saltHex:hashHex".
function hashPassword(password: string): string {
	const salt = randomBytes(16);
	const derived = scryptSync(password, salt, 64);
	return `${salt.toString('hex')}:${derived.toString('hex')}`;
}

export default async function globalSetup() {
	try { rmSync(DB_PATH); } catch { /* first run */ }
	mkdirSync(UPLOAD_DIR, { recursive: true });
	// A 5 MB photo file so the admin's storage usage shows a clear non-zero MB value.
	writeFileSync(join(UPLOAD_DIR, ADMIN_PHOTO), Buffer.alloc(5 * 1024 * 1024, 1)); // 5 MB

	const sqlite = new Database(DB_PATH);
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: 'drizzle' });

	const now = new Date();

	// Admin is seeded with isAdmin=true; ensureAdminUser() will find it and only re-sync
	// its password hash to ADMIN_PASSWORD (still verifies), keeping this username/token.
	// The admin has NO email (it can't self-reset).
	await db.insert(schema.user).values([
		{
			id: ADMIN.id,
			email: null,
			username: ADMIN.username,
			passwordHash: hashPassword(ADMIN.password),
			isAdmin: true,
			quotaBytes: null,
			apiToken: ADMIN.apiToken,
			createdAt: now,
			updatedAt: now
		},
		{
			id: BOB.id,
			email: BOB.email,
			username: BOB.username,
			passwordHash: hashPassword(BOB.password),
			isAdmin: false,
			quotaBytes: 500 * 1024 * 1024,
			apiToken: BOB.apiToken,
			createdAt: now,
			updatedAt: now
		}
	]);

	// Per-user data (explicit userId — no orphan rows, so ownership is deterministic).
	await db.insert(schema.lure).values([
		{ id: ADMIN_LURE.id, userId: ADMIN.id, lureNumber: 1, name: ADMIN_LURE.name, brand: 'Mepps', type: 'Spinner', color: 'Silver', photoPath: ADMIN_PHOTO, amount: 1, createdAt: now, updatedAt: now },
		{ id: BOB_LURE.id, userId: BOB.id, lureNumber: 1, name: BOB_LURE.name, brand: 'Rapala', type: 'Crankbait', color: 'Blue', amount: 1, createdAt: now, updatedAt: now }
	]);

	await db.insert(schema.spot).values([
		{ id: ADMIN_SPOT.id, userId: ADMIN.id, name: ADMIN_SPOT.name, lat: 52.52, lng: 13.405, createdAt: now, updatedAt: now },
		{ id: BOB_SPOT.id, userId: BOB.id, name: BOB_SPOT.name, lat: 48.13, lng: 11.58, createdAt: now, updatedAt: now }
	]);

	sqlite.close();
}
