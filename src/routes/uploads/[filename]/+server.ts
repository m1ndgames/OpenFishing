import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { UPLOAD_DIR, getThumbnail, isThumbWidth } from '#lib/server/uploads.js';
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

const CACHE = 'public, max-age=31536000, immutable';

/** Files whose thumbnail failed, so the fallback is logged once per process, not per request. */
const thumbFailures = new Set<string>();

export const GET: RequestHandler = async ({ params, url }) => {
	const { filename } = params;
	if (filename.includes('/') || filename.includes('\\') || filename.includes('..') || filename.startsWith('.')) error(400);

	// `?w=160|320|640` serves a cached, downscaled WebP for grids and list rows.
	// Unknown widths fall through to the original so a typo never breaks an image.
	// If the thumbnail can't be built (e.g. a file sharp can't decode), serve the original
	// instead — a slower image beats a broken one.
	const w = Number(url.searchParams.get('w'));
	if (isThumbWidth(w)) {
		try {
			const buf = await getThumbnail(filename, w);
			return new Response(new Uint8Array(buf), { headers: { 'Content-Type': 'image/webp', 'Cache-Control': CACHE } });
		} catch (e) {
			if (!thumbFailures.has(filename)) {
				thumbFailures.add(filename);
				console.error(`[uploads] no thumbnail for ${filename}, serving the original:`, e);
			}
		}
	}

	try {
		const buf = await readFile(join(UPLOAD_DIR, filename));
		const mime = MIME[extname(filename).toLowerCase()] ?? 'application/octet-stream';
		return new Response(new Uint8Array(buf), {
			headers: {
				'Content-Type': mime,
				'Cache-Control': CACHE
			}
		});
	} catch (e) {
		console.error(`[uploads] failed to read ${join(UPLOAD_DIR, filename)}:`, e);
		error(404);
	}
};
