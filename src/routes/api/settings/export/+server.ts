import type { RequestHandler } from './$types';
import { ownerId } from '$lib/server/scope';
import { buildBackup, packBackupZip } from '$lib/server/backup';

export const GET: RequestHandler = ({ locals }) => {
	const payload = buildBackup('user', ownerId(locals));
	const buffer = packBackupZip(payload);
	const date = new Date().toISOString().split('T')[0];

	return new Response(buffer as unknown as BodyInit, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="openfishing-backup-${date}.zip"`,
			'Content-Length': String(buffer.length)
		}
	});
};
