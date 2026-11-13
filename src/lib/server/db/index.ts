import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import Database from 'better-sqlite3';
import * as schema from './schema';
import { building } from '$app/env';
import { env } from '#lib/server/env.js';

if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set');

export const client = new Database(env.DATABASE_URL);

export const db = drizzle(client, { schema });

// Not while `vite build` analyses the server bundle: that imports this module too, and
// would migrate whatever DATABASE_URL points at on the build machine (a db:push-created
// local.db fails with "table already exists"). The server migrates on its first start.
if (process.env.NODE_ENV === 'production' && !building) {
	migrate(db, { migrationsFolder: 'drizzle' });
}
