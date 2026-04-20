import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { UPLOAD_DIR } from '$lib/server/uploads';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MIME: Record<string, string> = {
	'.jpg': 'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.png': 'image/png',
	'.gif': 'image/gif',
	'.webp': 'image/webp',
	'.avif': 'image/avif'
};

export const GET: RequestHandler = async ({ params }) => {
	const { filename } = params;
	if (filename.includes('/') || filename.includes('..')) error(400);

	try {
		const buf = await readFile(join(UPLOAD_DIR, filename));
		const mime = MIME[extname(filename).toLowerCase()] ?? 'application/octet-stream';
		return new Response(buf, {
			headers: {
				'Content-Type': mime,
				'Cache-Control': 'public, max-age=31536000, immutable'
			}
		});
	} catch (e) {
		console.error(`[uploads] failed to read ${join(UPLOAD_DIR, filename)}:`, e);
		error(404);
	}
};
