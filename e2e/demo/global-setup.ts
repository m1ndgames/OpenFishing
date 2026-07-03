import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync, rmSync } from 'node:fs';
import * as schema from '../../src/lib/server/db/schema';

const DB_PATH = 'e2e/test-demo.db';
const UPLOAD_DIR = 'e2e/uploads-demo';

export default async function globalSetup() {
	try { rmSync(DB_PATH); } catch { /* first run */ }
	mkdirSync(UPLOAD_DIR, { recursive: true });

	const sqlite = new Database(DB_PATH);
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: 'drizzle' });
	sqlite.close();
}
