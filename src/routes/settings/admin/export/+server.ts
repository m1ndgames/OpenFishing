import type { RequestHandler } from './$types';
import { buildBackup, packBackupZip } from '$lib/server/backup';

// Admin-only (the /admin prefix is gated in hooks.server.ts). Full backup of every
// user's data plus the user accounts themselves.
export const GET: RequestHandler = () => {
	const payload = buildBackup('all', null);
	const buffer = packBackupZip(payload);
	const date = new Date().toISOString().split('T')[0];

	return new Response(buffer as unknown as BodyInit, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="openfishing-full-backup-${date}.zip"`,
			'Content-Length': String(buffer.length)
		}
	});
};
