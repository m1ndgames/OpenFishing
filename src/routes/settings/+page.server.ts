import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db, client } from '$lib/server/db';
import { lure } from '$lib/server/db/schema';
import { getSchemaHash } from '$lib/server/db/schema-hash';
import { UPLOAD_DIR } from '$lib/server/uploads';
import { count } from 'drizzle-orm';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import AdmZip from 'adm-zip';

export const load: PageServerLoad = async () => {
	const [{ lureCount }] = db.select({ lureCount: count() }).from(lure).all();
	return {
		schemaHash: getSchemaHash(client),
		lureCount
	};
};

export const actions: Actions = {
	import: async ({ request }) => {
		const formData = await request.formData();
		const file = formData.get('backup') as File;

		if (!file || file.size === 0) return fail(400, { error: 'No file provided.' });
		if (!file.name.endsWith('.zip')) return fail(400, { error: 'File must be a .zip backup.' });

		let zip: AdmZip;
		try {
			zip = new AdmZip(Buffer.from(await file.arrayBuffer()));
		} catch {
			return fail(400, { error: 'Could not read the ZIP file.' });
		}

		// Parse manifest
		const jsonEntry = zip.getEntry('backup.json');
		if (!jsonEntry) return fail(400, { error: 'Invalid backup — backup.json not found in archive.' });

		let payload: {
			meta: { schemaHash: string; appVersion: string; exportedAt: string };
			lures: Record<string, unknown>[];
			tags: Record<string, unknown>[];
		};
		try {
			payload = JSON.parse(jsonEntry.getData().toString('utf-8'));
		} catch {
			return fail(400, { error: 'Could not parse backup.json.' });
		}

		if (!payload?.meta?.schemaHash || !Array.isArray(payload.lures) || !Array.isArray(payload.tags)) {
			return fail(400, { error: 'Invalid backup format — missing required fields.' });
		}

		// Schema version check
		const currentHash = getSchemaHash(client);
		if (payload.meta.schemaHash !== currentHash) {
			return fail(409, {
				error: `Schema mismatch — this backup is incompatible with the current database schema. Backup: ${payload.meta.schemaHash.slice(0, 8)}… / Current: ${currentHash.slice(0, 8)}…`
			});
		}

		// Extract photo files first (before touching the DB)
		mkdirSync(UPLOAD_DIR, { recursive: true });
		const photoEntries = zip.getEntries().filter((e) => e.entryName.startsWith('uploads/') && !e.isDirectory);
		for (const entry of photoEntries) {
			const filename = entry.entryName.replace('uploads/', '');
			if (filename) {
				writeFileSync(join(UPLOAD_DIR, filename), entry.getData());
			}
		}

		// Replace DB contents in a single transaction
		const importFn = client.transaction(() => {
			client.prepare('DELETE FROM tag').run();
			client.prepare('DELETE FROM lure').run();

			const insertLure = client.prepare(
				`INSERT INTO lure (id, lure_number, name, brand, type, color, weight, size, notes,
				 photo_path, species, running_depth, water_type, light_conditions, qr_coded, created_at, updated_at)
				 VALUES (@id, @lure_number, @name, @brand, @type, @color, @weight, @size, @notes,
				 @photo_path, @species, @running_depth, @water_type, @light_conditions, @qr_coded, @created_at, @updated_at)`
			);
			const insertTag = client.prepare(
				`INSERT INTO tag (id, lure_id, name) VALUES (@id, @lure_id, @name)`
			);

			for (const l of payload.lures) {
				insertLure.run({
					id: l.id,
					lure_number: l.lureNumber ?? null,
					name: l.name ?? 'Untitled',
					brand: l.brand ?? null,
					type: l.type ?? null,
					color: l.color ?? null,
					weight: l.weight ?? null,
					size: l.size ?? null,
					notes: l.notes ?? null,
					photo_path: l.photoPath ?? null,
					species: l.species ?? null,
					running_depth: l.runningDepth ?? null,
					water_type: l.waterType ?? null,
					light_conditions: l.lightConditions ?? null,
					qr_coded: l.qrCoded ? 1 : 0,
					created_at: l.createdAt ? new Date(l.createdAt as string).getTime() : null,
					updated_at: l.updatedAt ? new Date(l.updatedAt as string).getTime() : null
				});
			}

			for (const t of payload.tags) {
				insertTag.run({ id: t.id, lure_id: t.lureId, name: t.name });
			}

			return { lureCount: payload.lures.length, tagCount: payload.tags.length };
		});

		const result = importFn() as { lureCount: number; tagCount: number };
		return { success: true, ...result };
	}
};
