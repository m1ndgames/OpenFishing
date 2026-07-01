import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, basename } from 'node:path';
import AdmZip from 'adm-zip';
import { eq, inArray, isNull } from 'drizzle-orm';
import { db, client } from '$lib/server/db';
import * as s from '$lib/server/db/schema';
import { getSchemaHash } from '$lib/server/db/schema-hash';
import { UPLOAD_DIR } from '$lib/server/uploads';

export type BackupScope = 'user' | 'all';

export interface BackupPayload {
	meta: { exportedAt: string; appVersion: string; schemaHash: string; scope: BackupScope };
	users?: Record<string, unknown>[];
	lures: Record<string, unknown>[];
	tags: Record<string, unknown>[];
	spots: Record<string, unknown>[];
	spotTags: Record<string, unknown>[];
	spotPhotos: Record<string, unknown>[];
	catches: Record<string, unknown>[];
	catchPhotos: Record<string, unknown>[];
	rods: Record<string, unknown>[];
	reels: Record<string, unknown>[];
	lines: Record<string, unknown>[];
	combos: Record<string, unknown>[];
	reelLineLogs: Record<string, unknown>[];
}

// Timestamp fields per collection — revived from ISO strings back to Date on import.
const DATE_FIELDS: Record<string, string[]> = {
	users: ['createdAt', 'updatedAt'],
	lures: ['createdAt', 'updatedAt'],
	spots: ['createdAt', 'updatedAt'],
	catches: ['caughtAt', 'createdAt', 'updatedAt'],
	rods: ['createdAt', 'updatedAt'],
	reels: ['createdAt', 'updatedAt'],
	lines: ['createdAt', 'updatedAt'],
	combos: ['createdAt', 'updatedAt'],
	reelLineLogs: ['spooledAt', 'createdAt']
};

export function getAppVersion(): string {
	try {
		return JSON.parse(readFileSync('package.json', 'utf-8')).version ?? '0.0.1';
	} catch {
		return '0.0.1';
	}
}

function reviveDates(row: Record<string, unknown>, fields: string[]): Record<string, unknown> {
	const out = { ...row };
	for (const f of fields) {
		if (out[f] != null) out[f] = new Date(out[f] as string);
	}
	return out;
}

// ── Build ────────────────────────────────────────────────────────────────────

/**
 * Build a backup payload. `userId` non-null → only that user's data (scope 'user').
 * `userId` null with scope 'user' → all data (open mode). scope 'all' → every user's
 * data plus the user accounts (admin disaster-recovery backup).
 */
export function buildBackup(scope: BackupScope, userId: string | null): BackupPayload {
	const all = scope === 'all';
	const ownerCond = (col: any) => (all ? undefined : userId ? eq(col, userId) : undefined);

	const lures = db.select().from(s.lure).where(ownerCond(s.lure.userId)).all();
	const spots = db.select().from(s.spot).where(ownerCond(s.spot.userId)).all();
	const catches = db.select().from(s.fishCatch).where(ownerCond(s.fishCatch.userId)).all();
	const rods = db.select().from(s.rod).where(ownerCond(s.rod.userId)).all();
	const reels = db.select().from(s.reel).where(ownerCond(s.reel.userId)).all();
	const lines = db.select().from(s.fishingLine).where(ownerCond(s.fishingLine.userId)).all();
	const combos = db.select().from(s.combo).where(ownerCond(s.combo.userId)).all();

	const lureIds = lures.map((l) => l.id);
	const spotIds = spots.map((x) => x.id);
	const catchIds = catches.map((c) => c.id);
	const reelIds = reels.map((r) => r.id);

	const pick = <T>(rows: T[], all: boolean, fetch: () => T[]) => (all ? fetch() : rows);

	const tags = all ? db.select().from(s.tag).all() : (lureIds.length ? db.select().from(s.tag).where(inArray(s.tag.lureId, lureIds)).all() : []);
	const spotTags = all ? db.select().from(s.spotTag).all() : (spotIds.length ? db.select().from(s.spotTag).where(inArray(s.spotTag.spotId, spotIds)).all() : []);
	const spotPhotos = all ? db.select().from(s.spotPhoto).all() : (spotIds.length ? db.select().from(s.spotPhoto).where(inArray(s.spotPhoto.spotId, spotIds)).all() : []);
	const catchPhotos = all ? db.select().from(s.catchPhoto).all() : (catchIds.length ? db.select().from(s.catchPhoto).where(inArray(s.catchPhoto.catchId, catchIds)).all() : []);
	const reelLineLogs = all ? db.select().from(s.reelLineLog).all() : (reelIds.length ? db.select().from(s.reelLineLog).where(inArray(s.reelLineLog.reelId, reelIds)).all() : []);
	void pick;

	const payload: BackupPayload = {
		meta: { exportedAt: new Date().toISOString(), appVersion: getAppVersion(), schemaHash: getSchemaHash(client), scope },
		lures, tags, spots, spotTags, spotPhotos, catches, catchPhotos, rods, reels, lines, combos, reelLineLogs
	};
	if (all) payload.users = db.select().from(s.user).all();
	return payload;
}

// ── ZIP packaging ──────────────────────────────────────────────────────────────

export function backupPhotoFilenames(p: BackupPayload): string[] {
	return [
		...p.lures.map((l) => l.photoPath as string | null).filter((x): x is string => !!x),
		...p.spotPhotos.map((x) => x.filename as string),
		...p.catchPhotos.map((x) => x.filename as string)
	];
}

export function packBackupZip(payload: BackupPayload): Uint8Array {
	const zip = new AdmZip();
	zip.addFile('backup.json', Buffer.from(JSON.stringify(payload, null, 2), 'utf-8'));
	for (const filename of new Set(backupPhotoFilenames(payload))) {
		const filePath = join(UPLOAD_DIR, filename);
		if (existsSync(filePath)) zip.addLocalFile(filePath, 'uploads');
	}
	return new Uint8Array(zip.toBuffer());
}

export interface ParsedBackup { payload: BackupPayload; extractPhotos: () => void; }

/** Parse + validate a backup ZIP. Throws `BackupError` on any problem. */
export function parseBackupZip(buffer: Buffer, expectedScope: BackupScope): ParsedBackup {
	let zip: AdmZip;
	try {
		zip = new AdmZip(buffer);
	} catch {
		throw new BackupError('backupErrorUnreadable');
	}
	const entry = zip.getEntry('backup.json');
	if (!entry) throw new BackupError('backupErrorInvalid');

	let payload: BackupPayload;
	try {
		payload = JSON.parse(entry.getData().toString('utf-8'));
	} catch {
		throw new BackupError('backupErrorParse');
	}
	if (!payload?.meta?.schemaHash || !Array.isArray(payload.lures)) throw new BackupError('backupErrorInvalid');

	const currentHash = getSchemaHash(client);
	if (payload.meta.schemaHash !== currentHash) throw new BackupError('backupErrorSchema');

	const scope = payload.meta.scope ?? 'user';
	if (scope !== expectedScope) {
		throw new BackupError(expectedScope === 'all' ? 'backupErrorExpectedAll' : 'backupErrorExpectedUser');
	}

	const extractPhotos = () => {
		mkdirSync(UPLOAD_DIR, { recursive: true });
		for (const e of zip.getEntries()) {
			if (e.entryName.startsWith('uploads/') && !e.isDirectory) {
				const filename = basename(e.entryName);
				if (filename) writeFileSync(join(UPLOAD_DIR, filename), e.getData());
			}
		}
	};
	return { payload, extractPhotos };
}

export class BackupError extends Error {
	constructor(public key: string) {
		super(key);
		this.name = 'BackupError';
	}
}

// ── Restore ──────────────────────────────────────────────────────────────────

function insertAll(table: any, rows: Record<string, unknown>[], dateFields: string[]) {
	for (const r of rows) db.insert(table).values(reviveDates(r, dateFields)).run();
}

/** Replace only `userId`'s data (or all data in open mode when userId is null). */
export function restoreUserBackup(payload: BackupPayload, userId: string | null): { lureCount: number; spotCount: number; catchCount: number } {
	const run = client.transaction(() => {
		const userWhere = (col: any) => (userId ? eq(col, userId) : isNull(col));

		const lureIds = db.select({ id: s.lure.id }).from(s.lure).where(userWhere(s.lure.userId)).all().map((r) => r.id);
		const spotIds = db.select({ id: s.spot.id }).from(s.spot).where(userWhere(s.spot.userId)).all().map((r) => r.id);
		const catchIds = db.select({ id: s.fishCatch.id }).from(s.fishCatch).where(userWhere(s.fishCatch.userId)).all().map((r) => r.id);
		const reelIds = db.select({ id: s.reel.id }).from(s.reel).where(userWhere(s.reel.userId)).all().map((r) => r.id);

		if (catchIds.length) db.delete(s.catchPhoto).where(inArray(s.catchPhoto.catchId, catchIds)).run();
		db.delete(s.fishCatch).where(userWhere(s.fishCatch.userId)).run();
		if (spotIds.length) db.delete(s.spotPhoto).where(inArray(s.spotPhoto.spotId, spotIds)).run();
		if (spotIds.length) db.delete(s.spotTag).where(inArray(s.spotTag.spotId, spotIds)).run();
		db.delete(s.spot).where(userWhere(s.spot.userId)).run();
		if (lureIds.length) db.delete(s.tag).where(inArray(s.tag.lureId, lureIds)).run();
		db.delete(s.lure).where(userWhere(s.lure.userId)).run();
		if (reelIds.length) db.delete(s.reelLineLog).where(inArray(s.reelLineLog.reelId, reelIds)).run();
		db.delete(s.combo).where(userWhere(s.combo.userId)).run();
		db.delete(s.rod).where(userWhere(s.rod.userId)).run();
		db.delete(s.reel).where(userWhere(s.reel.userId)).run();
		db.delete(s.fishingLine).where(userWhere(s.fishingLine.userId)).run();

		// Re-stamp ownership on owned rows (a user's own backup already matches; this is defensive).
		const own = (rows: Record<string, unknown>[]) => rows.map((r) => ({ ...r, userId }));
		insertAll(s.rod, own(payload.rods), DATE_FIELDS.rods);
		insertAll(s.reel, own(payload.reels), DATE_FIELDS.reels);
		insertAll(s.fishingLine, own(payload.lines), DATE_FIELDS.lines);
		insertAll(s.reelLineLog, payload.reelLineLogs, DATE_FIELDS.reelLineLogs);
		insertAll(s.lure, own(payload.lures), DATE_FIELDS.lures);
		insertAll(s.tag, payload.tags, []);
		insertAll(s.spot, own(payload.spots), DATE_FIELDS.spots);
		insertAll(s.spotTag, payload.spotTags, []);
		insertAll(s.spotPhoto, payload.spotPhotos, []);
		insertAll(s.combo, own(payload.combos), DATE_FIELDS.combos);
		insertAll(s.fishCatch, own(payload.catches), DATE_FIELDS.catches);
		insertAll(s.catchPhoto, payload.catchPhotos, []);

		return { lureCount: payload.lures.length, spotCount: payload.spots.length, catchCount: payload.catches.length };
	});
	return run();
}

/** Full wipe + rebuild from an admin all-backup (preserves each row's userId). */
export function restoreAllBackup(payload: BackupPayload): { userCount: number; lureCount: number; spotCount: number; catchCount: number } {
	const run = client.transaction(() => {
		// Wipe everything (children first).
		db.delete(s.catchPhoto).run();
		db.delete(s.fishCatch).run();
		db.delete(s.spotPhoto).run();
		db.delete(s.spotTag).run();
		db.delete(s.spot).run();
		db.delete(s.tag).run();
		db.delete(s.lure).run();
		db.delete(s.reelLineLog).run();
		db.delete(s.combo).run();
		db.delete(s.rod).run();
		db.delete(s.reel).run();
		db.delete(s.fishingLine).run();
		db.delete(s.userSetting).run();
		db.delete(s.user).run();

		insertAll(s.user, payload.users ?? [], DATE_FIELDS.users);
		insertAll(s.rod, payload.rods, DATE_FIELDS.rods);
		insertAll(s.reel, payload.reels, DATE_FIELDS.reels);
		insertAll(s.fishingLine, payload.lines, DATE_FIELDS.lines);
		insertAll(s.reelLineLog, payload.reelLineLogs, DATE_FIELDS.reelLineLogs);
		insertAll(s.lure, payload.lures, DATE_FIELDS.lures);
		insertAll(s.tag, payload.tags, []);
		insertAll(s.spot, payload.spots, DATE_FIELDS.spots);
		insertAll(s.spotTag, payload.spotTags, []);
		insertAll(s.spotPhoto, payload.spotPhotos, []);
		insertAll(s.combo, payload.combos, DATE_FIELDS.combos);
		insertAll(s.fishCatch, payload.catches, DATE_FIELDS.catches);
		insertAll(s.catchPhoto, payload.catchPhotos, []);

		return { userCount: (payload.users ?? []).length, lureCount: payload.lures.length, spotCount: payload.spots.length, catchCount: payload.catches.length };
	});
	return run();
}
