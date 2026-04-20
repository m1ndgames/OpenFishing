import { createHash } from 'crypto';
import type Database from 'better-sqlite3';

type ColumnInfo = { name: string; type: string; notnull: number; dflt_value: string | null; pk: number };

export function getSchemaHash(sqlite: Database.Database): string {
	const tables = ['lure', 'tag'];
	const parts: string[] = [];

	for (const table of tables) {
		const columns = sqlite.prepare(`PRAGMA table_info('${table}')`).all() as ColumnInfo[];

		// Sort by name so column order (migrate vs push) doesn't affect the hash
		const normalized = columns
			.sort((a, b) => a.name.localeCompare(b.name))
			.map((c) => `${c.name}:${c.type.toUpperCase()}:${c.notnull}:${c.dflt_value ?? ''}:${c.pk}`)
			.join(',');

		parts.push(`${table}(${normalized})`);
	}

	return createHash('sha256').update(parts.join('|')).digest('hex');
}
