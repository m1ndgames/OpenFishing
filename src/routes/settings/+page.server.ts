import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db, client } from '#lib/server/db/index.js';
import { lure, spot, fishCatch } from '#lib/server/db/schema.js';
import { getSchemaHash } from '#lib/server/db/schema-hash.js';
import { count } from 'drizzle-orm';
import { ownerId, userFilter } from '#lib/server/scope.js';
import { parseBackupZip, restoreUserBackup, BackupError } from '#lib/server/backup.js';

export const load: PageServerLoad = async ({ locals }) => {
	const [[{ lureCount }], [{ spotCount }], [{ catchCount }]] = await Promise.all([
		db.select({ lureCount: count() }).from(lure).where(userFilter(locals, lure.userId)),
		db.select({ spotCount: count() }).from(spot).where(userFilter(locals, spot.userId)),
		db.select({ catchCount: count() }).from(fishCatch).where(userFilter(locals, fishCatch.userId))
	]);
	return {
		schemaHash: getSchemaHash(client),
		lureCount,
		spotCount,
		catchCount
	};
};

export const actions: Actions = {
	import: async ({ request, locals }) => {
		const uid = ownerId(locals);
		const formData = await request.formData();
		const file = formData.get('backup') as File;

		if (!file || file.size === 0) return fail(400, { error: 'backupErrorNoFile' });
		if (!file.name.endsWith('.zip')) return fail(400, { error: 'backupErrorNotZip' });

		try {
			const { payload, extractPhotos } = parseBackupZip(Buffer.from(await file.arrayBuffer()), 'user');
			extractPhotos();
			const result = restoreUserBackup(payload, uid);
			return { success: true, ...result };
		} catch (e) {
			if (e instanceof BackupError) return fail(e.key === 'backupErrorSchema' ? 409 : 400, { error: e.key });
			throw e;
		}
	}
};
