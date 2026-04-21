import type { RequestHandler } from './$types';
import { db, client } from '$lib/server/db';
import { lure, tag, spot, spotTag, spotPhoto, fishCatch, catchPhoto } from '$lib/server/db/schema';
import { getSchemaHash } from '$lib/server/db/schema-hash';
import { UPLOAD_DIR } from '$lib/server/uploads';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import AdmZip from 'adm-zip';

function getAppVersion(): string {
	try {
		return JSON.parse(readFileSync('package.json', 'utf-8')).version ?? '0.0.1';
	} catch {
		return '0.0.1';
	}
}

export const GET: RequestHandler = () => {
	const lures = db.select().from(lure).all();
	const tags = db.select().from(tag).all();
	const spots = db.select().from(spot).all();
	const spotTags = db.select().from(spotTag).all();
	const spotPhotos = db.select().from(spotPhoto).all();
	const catches = db.select().from(fishCatch).all();
	const catchPhotos = db.select().from(catchPhoto).all();

	const zip = new AdmZip();

	const payload = {
		meta: {
			exportedAt: new Date().toISOString(),
			appVersion: getAppVersion(),
			schemaHash: getSchemaHash(client)
		},
		lures,
		tags,
		spots,
		spotTags,
		spotPhotos,
		catches,
		catchPhotos
	};
	zip.addFile('backup.json', Buffer.from(JSON.stringify(payload, null, 2), 'utf-8'));

	// Lure photos
	for (const l of lures) {
		if (!l.photoPath) continue;
		const filePath = join(UPLOAD_DIR, l.photoPath);
		if (existsSync(filePath)) zip.addLocalFile(filePath, 'uploads');
	}

	// Spot photos
	for (const p of spotPhotos) {
		const filePath = join(UPLOAD_DIR, p.filename);
		if (existsSync(filePath)) zip.addLocalFile(filePath, 'uploads');
	}

	// Catch photos
	for (const p of catchPhotos) {
		const filePath = join(UPLOAD_DIR, p.filename);
		if (existsSync(filePath)) zip.addLocalFile(filePath, 'uploads');
	}

	const date = new Date().toISOString().split('T')[0];
	const buffer = zip.toBuffer();

	return new Response(buffer, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="openfishing-backup-${date}.zip"`,
			'Content-Length': String(buffer.length)
		}
	});
};
