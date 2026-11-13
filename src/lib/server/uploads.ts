import { mkdir, unlink, stat, writeFile, readFile, rename } from 'node:fs/promises';
import { join, parse } from 'node:path';
import { env } from '#lib/server/env.js';
import { and, eq, inArray, isNotNull } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';
import sharp from 'sharp';
import { db } from '#lib/server/db/index.js';
import { lure, spot, spotPhoto, fishCatch, catchPhoto } from '#lib/server/db/schema.js';

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

/** Widths `/uploads/<file>?w=` serves; anything else gets the original. */
// 1280 serves the detail pages on 2x/3x phones, which would otherwise pick the 1920px original.
export const THUMB_WIDTHS = [160, 320, 640, 1280] as const;
export type ThumbWidth = (typeof THUMB_WIDTHS)[number];

export function isThumbWidth(w: number): w is ThumbWidth {
	return (THUMB_WIDTHS as readonly number[]).includes(w);
}

/**
 * Downscaled copies live in a hidden cache dir next to the originals. They are
 * derived data: not referenced from the DB, so backups and quota usage ignore them,
 * and a missing one is simply regenerated on the next request.
 */
export const THUMB_DIR = join(UPLOAD_DIR, '.thumbs');

export function thumbPath(filename: string, width: ThumbWidth): string {
	return join(THUMB_DIR, `${parse(filename).name}-${width}.webp`);
}

/**
 * The WebP thumbnail for `filename` at `width`, created (and cached) on first request.
 * Throws if the original doesn't exist.
 */
export async function getThumbnail(filename: string, width: ThumbWidth): Promise<Buffer> {
	const cached = thumbPath(filename, width);
	try {
		return await readFile(cached);
	} catch {
		// Not generated yet
	}
	const original = await readFile(join(UPLOAD_DIR, filename));
	const output = await sharp(original)
		.rotate()
		.resize(width, width, { fit: 'inside', withoutEnlargement: true })
		.webp({ quality: 75 })
		.toBuffer();
	try {
		await mkdir(THUMB_DIR, { recursive: true });
		// Write-then-rename so a concurrent request never reads a half-written file.
		const tmp = `${cached}.${crypto.randomUUID()}.tmp`;
		await writeFile(tmp, output);
		await rename(tmp, cached);
	} catch (e) {
		console.error(`[uploads] could not cache thumbnail ${cached}:`, e); // still serve it
	}
	return output;
}

export async function deleteUpload(filename: string): Promise<void> {
	for (const path of [join(UPLOAD_DIR, filename), ...THUMB_WIDTHS.map((w) => thumbPath(filename, w))]) {
		try {
			await unlink(path);
		} catch {
			// File already gone (or thumbnail never generated) — not an error
		}
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
