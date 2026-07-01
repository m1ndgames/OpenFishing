import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db, client } from '$lib/server/db';
import { lure, spot, fishCatch } from '$lib/server/db/schema';
import { getSchemaHash } from '$lib/server/db/schema-hash';
import { count } from 'drizzle-orm';
import { ownerId, userFilter } from '$lib/server/scope';
import { parseBackupZip, restoreUserBackup, BackupError } from '$lib/server/backup';

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
