import { createHash } from 'crypto';
import type Database from 'better-sqlite3';

export function getSchemaHash(sqlite: Database.Database): string {
	const rows = sqlite
		.prepare(
			"SELECT sql FROM sqlite_master WHERE type='table' AND name IN ('lure','tag') ORDER BY name"
		)
		.all() as Array<{ sql: string }>;

	const normalized = rows.map((r) => r.sql.replace(/\s+/g, ' ').trim()).join('\n');
	return createHash('sha256').update(normalized).digest('hex');
}
