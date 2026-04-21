import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db, client } from '$lib/server/db';
import { lure, tag, spot, spotTag, spotPhoto, fishCatch, catchPhoto } from '$lib/server/db/schema';
import { getSchemaHash } from '$lib/server/db/schema-hash';
import { UPLOAD_DIR } from '$lib/server/uploads';
import { count } from 'drizzle-orm';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import AdmZip from 'adm-zip';

export const load: PageServerLoad = async () => {
	const [[{ lureCount }], [{ spotCount }], [{ catchCount }]] = await Promise.all([
		db.select({ lureCount: count() }).from(lure),
		db.select({ spotCount: count() }).from(spot),
		db.select({ catchCount: count() }).from(fishCatch)
	]);
	return {
		schemaHash: getSchemaHash(client),
		lureCount,
		spotCount,
		catchCount
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

		const jsonEntry = zip.getEntry('backup.json');
		if (!jsonEntry) return fail(400, { error: 'Invalid backup — backup.json not found in archive.' });

		let payload: {
			meta: { schemaHash: string; appVersion: string; exportedAt: string };
			lures: Record<string, unknown>[];
			tags: Record<string, unknown>[];
			spots: Record<string, unknown>[];
			spotTags: Record<string, unknown>[];
			spotPhotos: Record<string, unknown>[];
			catches: Record<string, unknown>[];
			catchPhotos: Record<string, unknown>[];
		};
		try {
			payload = JSON.parse(jsonEntry.getData().toString('utf-8'));
		} catch {
			return fail(400, { error: 'Could not parse backup.json.' });
		}

		if (!payload?.meta?.schemaHash || !Array.isArray(payload.lures) || !Array.isArray(payload.tags)) {
			return fail(400, { error: 'Invalid backup format — missing required fields.' });
		}

		const currentHash = getSchemaHash(client);
		if (payload.meta.schemaHash !== currentHash) {
			return fail(409, {
				error: `Schema mismatch — this backup is incompatible with the current database schema. Backup: ${payload.meta.schemaHash.slice(0, 8)}… / Current: ${currentHash.slice(0, 8)}…`
			});
		}

		// Extract photo files before touching the DB
		mkdirSync(UPLOAD_DIR, { recursive: true });
		const photoEntries = zip.getEntries().filter((e) => e.entryName.startsWith('uploads/') && !e.isDirectory);
		for (const entry of photoEntries) {
			const filename = entry.entryName.replace('uploads/', '');
			if (filename) writeFileSync(join(UPLOAD_DIR, filename), entry.getData());
		}

		const importFn = client.transaction(() => {
			// Delete in FK-safe order (children first)
			client.prepare('DELETE FROM catch_photo').run();
			client.prepare('DELETE FROM fish_catch').run();
			client.prepare('DELETE FROM spot_photo').run();
			client.prepare('DELETE FROM spot_tag').run();
			client.prepare('DELETE FROM spot').run();
			client.prepare('DELETE FROM tag').run();
			client.prepare('DELETE FROM lure').run();

			// Lures
			const insertLure = client.prepare(
				`INSERT INTO lure (id, lure_number, name, brand, type, color, weight, size, notes,
				 photo_path, species, running_depth, water_type, light_conditions, qr_coded, created_at, updated_at)
				 VALUES (@id, @lure_number, @name, @brand, @type, @color, @weight, @size, @notes,
				 @photo_path, @species, @running_depth, @water_type, @light_conditions, @qr_coded, @created_at, @updated_at)`
			);
			for (const l of payload.lures) {
				insertLure.run({
					id: l.id, lure_number: l.lureNumber ?? null, name: l.name ?? 'Untitled',
					brand: l.brand ?? null, type: l.type ?? null, color: l.color ?? null,
					weight: l.weight ?? null, size: l.size ?? null, notes: l.notes ?? null,
					photo_path: l.photoPath ?? null, species: l.species ?? null,
					running_depth: l.runningDepth ?? null, water_type: l.waterType ?? null,
					light_conditions: l.lightConditions ?? null, qr_coded: l.qrCoded ? 1 : 0,
					created_at: l.createdAt ? new Date(l.createdAt as string).getTime() : null,
					updated_at: l.updatedAt ? new Date(l.updatedAt as string).getTime() : null
				});
			}

			// Lure tags
			const insertTag = client.prepare(`INSERT INTO tag (id, lure_id, name) VALUES (@id, @lure_id, @name)`);
			for (const t of payload.tags) {
				insertTag.run({ id: t.id, lure_id: t.lureId, name: t.name });
			}

			// Spots
			const insertSpot = client.prepare(
				`INSERT INTO spot (id, name, lat, lng, notes, created_at, updated_at)
				 VALUES (@id, @name, @lat, @lng, @notes, @created_at, @updated_at)`
			);
			for (const s of (payload.spots ?? [])) {
				insertSpot.run({
					id: s.id, name: s.name ?? 'Untitled', lat: s.lat, lng: s.lng, notes: s.notes ?? null,
					created_at: s.createdAt ? new Date(s.createdAt as string).getTime() : null,
					updated_at: s.updatedAt ? new Date(s.updatedAt as string).getTime() : null
				});
			}

			// Spot tags
			const insertSpotTag = client.prepare(`INSERT INTO spot_tag (id, spot_id, name) VALUES (@id, @spot_id, @name)`);
			for (const t of (payload.spotTags ?? [])) {
				insertSpotTag.run({ id: t.id, spot_id: t.spotId, name: t.name });
			}

			// Spot photos
			const insertSpotPhoto = client.prepare(
				`INSERT INTO spot_photo (id, spot_id, filename, sort_order) VALUES (@id, @spot_id, @filename, @sort_order)`
			);
			for (const p of (payload.spotPhotos ?? [])) {
				insertSpotPhoto.run({ id: p.id, spot_id: p.spotId, filename: p.filename, sort_order: p.sortOrder ?? 0 });
			}

			// Catches
			const insertCatch = client.prepare(
				`INSERT INTO fish_catch (id, caught_at, species, weight_g, length_cm, lat, lng, notes, lure_id, created_at, updated_at)
				 VALUES (@id, @caught_at, @species, @weight_g, @length_cm, @lat, @lng, @notes, @lure_id, @created_at, @updated_at)`
			);
			for (const c of (payload.catches ?? [])) {
				insertCatch.run({
					id: c.id, species: c.species ?? null, weight_g: c.weightG ?? null,
					length_cm: c.lengthCm ?? null, lat: c.lat ?? null, lng: c.lng ?? null,
					notes: c.notes ?? null, lure_id: c.lureId ?? null,
					caught_at: c.caughtAt ? new Date(c.caughtAt as string).getTime() : Date.now(),
					created_at: c.createdAt ? new Date(c.createdAt as string).getTime() : null,
					updated_at: c.updatedAt ? new Date(c.updatedAt as string).getTime() : null
				});
			}

			// Catch photos
			const insertCatchPhoto = client.prepare(
				`INSERT INTO catch_photo (id, catch_id, filename, sort_order) VALUES (@id, @catch_id, @filename, @sort_order)`
			);
			for (const p of (payload.catchPhotos ?? [])) {
				insertCatchPhoto.run({ id: p.id, catch_id: p.catchId, filename: p.filename, sort_order: p.sortOrder ?? 0 });
			}

			return {
				lureCount: payload.lures.length,
				spotCount: (payload.spots ?? []).length,
				catchCount: (payload.catches ?? []).length
			};
		});

		const result = importFn() as { lureCount: number; spotCount: number; catchCount: number };
		return { success: true, ...result };
	}
};
