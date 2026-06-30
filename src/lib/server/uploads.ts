import { mkdir, unlink, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '$env/dynamic/private';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import sharp from 'sharp';
import { db } from '$lib/server/db';
import { lure, spot, spotPhoto, fishCatch, catchPhoto } from '$lib/server/db/schema';

export const UPLOAD_DIR = env.UPLOAD_PATH ?? './uploads';

/** Owner whose storage quota/usage an upload counts against. */
export type UploadOwner = { id: string; quotaBytes: number | null } | null | undefined;

/** Thrown by `saveUpload` when writing the file would exceed the owner's quota. */
export class QuotaExceededError extends Error {
	constructor() {
		super('Upload quota exceeded');
		this.name = 'QuotaExceededError';
	}
}

/**
 * Actual storage used by a user, computed from the photo files on disk (lure photos +
 * spot photos + catch photos). Computed on demand so it's always accurate — there is no
 * stored counter to drift, and it reflects data created before multi-user too. `userId`
 * null sums every photo (open / single-tenant mode).
 */
export async function getUsedBytes(userId: string | null): Promise<number> {
	const own = (col: SQLiteColumn) => (userId ? eq(col, userId) : undefined);

	const lurePhotos = await db
		.select({ f: lure.photoPath })
		.from(lure)
		.where(and(own(lure.userId), isNotNull(lure.photoPath)));
	const spotIds = (await db.select({ id: spot.id }).from(spot).where(own(spot.userId))).map((r) => r.id);
	const spotPhotos = spotIds.length
		? await db.select({ f: spotPhoto.filename }).from(spotPhoto).where(inArray(spotPhoto.spotId, spotIds))
		: [];
	const catchIds = (await db.select({ id: fishCatch.id }).from(fishCatch).where(own(fishCatch.userId))).map((r) => r.id);
	const catchPhotos = catchIds.length
		? await db.select({ f: catchPhoto.filename }).from(catchPhoto).where(inArray(catchPhoto.catchId, catchIds))
		: [];

	const filenames = [
		...lurePhotos.map((r) => r.f).filter((x): x is string => !!x),
		...spotPhotos.map((r) => r.f),
		...catchPhotos.map((r) => r.f)
	];

	let total = 0;
	for (const fn of filenames) {
		try {
			total += (await stat(join(UPLOAD_DIR, fn))).size;
		} catch {
			// File missing on disk — skip
		}
	}
	return total;
}

export async function deleteUpload(filename: string): Promise<void> {
	try {
		await unlink(join(UPLOAD_DIR, filename));
	} catch {
		// File already gone — not an error
	}
}

export async function saveUpload(file: File, owner?: UploadOwner): Promise<string> {
	await mkdir(UPLOAD_DIR, { recursive: true });
	const input = Buffer.from(await file.arrayBuffer());
	const output = await sharp(input)
		.rotate()
		.resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
		.jpeg({ quality: 85 })
		.toBuffer();

	if (owner && owner.quotaBytes != null) {
		const used = await getUsedBytes(owner.id);
		if (used + output.length > owner.quotaBytes) throw new QuotaExceededError();
	}

	const filename = `${crypto.randomUUID()}.jpg`;
	await writeFile(join(UPLOAD_DIR, filename), output);
	return filename;
}
