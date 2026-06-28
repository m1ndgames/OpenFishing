import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import * as schema from '../src/lib/server/db/schema';
import { LURE_IDS, SPOT_IDS, CATCH_IDS } from './fixtures';

function pngChunk(type: string, data: Buffer): Buffer {
	const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
	const chunk = Buffer.concat([Buffer.from(type, 'ascii'), data]);
	const crc = Buffer.alloc(4);
	crc.writeInt32BE(crc32(chunk), 0);
	return Buffer.concat([len, chunk, crc]);
}
function crc32(buf: Buffer): number {
	const table = Array.from({ length: 256 }, (_, i) => {
		let c = i;
		for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
		return c >>> 0;
	});
	let crc = 0xFFFFFFFF;
	for (const b of buf) crc = table[(crc ^ b) & 0xFF] ^ (crc >>> 8);
	return ((crc ^ 0xFFFFFFFF) | 0);
}
function buildPng(w: number, h: number, r: number, g: number, b: number): Buffer {
	const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
	const ihdr = Buffer.alloc(13);
	ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
	ihdr[8] = 8; ihdr[9] = 2; // bit depth 8, RGB
	const raw = Buffer.alloc((1 + w * 3) * h);
	for (let y = 0; y < h; y++) {
		raw[y * (1 + w * 3)] = 0; // filter none
		for (let x = 0; x < w; x++) {
			raw[y * (1 + w * 3) + 1 + x * 3] = r;
			raw[y * (1 + w * 3) + 2 + x * 3] = g;
			raw[y * (1 + w * 3) + 3 + x * 3] = b;
		}
	}
	return Buffer.concat([
		sig,
		pngChunk('IHDR', ihdr),
		pngChunk('IDAT', deflateSync(raw)),
		pngChunk('IEND', Buffer.alloc(0)),
	]);
}

export default async function globalSetup() {
	try { rmSync('e2e/test.db'); } catch { /* first run */ }
	mkdirSync('e2e/uploads', { recursive: true });
	mkdirSync('e2e/fixtures', { recursive: true });
	// Generate a valid 50×50 solid-color PNG using raw PNG encoding (no native deps)
	writeFileSync('e2e/fixtures/test-photo.jpg', buildPng(50, 50, 0, 128, 200));

	const sqlite = new Database('e2e/test.db');
	const db = drizzle(sqlite, { schema });
	migrate(db, { migrationsFolder: 'drizzle' });

	const now = new Date();

	// Lures
	await db.insert(schema.lure).values([
		{
			id: LURE_IDS[0],
			lureNumber: 1,
			name: 'Silver Spinner',
			brand: 'Mepps',
			type: 'Spinner',
			color: 'Silver',
			weight: 7,
			species: 'Pike Perch',
			waterType: 'Clear',
			lightConditions: 7,
			amount: 2,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: LURE_IDS[1],
			lureNumber: 2,
			name: 'Gold Jig',
			brand: 'Berkley',
			type: 'Jig',
			color: 'Gold',
			weight: 10,
			species: 'Pike',
			waterType: 'Murky',
			lightConditions: 3,
			favourite: true,
			amount: 1,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: LURE_IDS[2],
			lureNumber: 3,
			name: 'Lost Crankbait',
			brand: 'Rapala',
			type: 'Crankbait',
			color: 'Blue',
			weight: 14,
			species: 'Pike',
			lost: true,
			amount: 1,
			createdAt: now,
			updatedAt: now,
		},
	]);

	await db.insert(schema.tag).values([
		{ id: 'tag-0001', lureId: LURE_IDS[0], name: 'river' },
		{ id: 'tag-0002', lureId: LURE_IDS[0], name: 'lake' },
		{ id: 'tag-0003', lureId: LURE_IDS[1], name: 'lake' },
	]);

	// Spots
	await db.insert(schema.spot).values([
		{
			id: SPOT_IDS[0],
			name: 'Test Lake North',
			lat: 52.5200,
			lng: 13.4050,
			notes: 'Great early morning spot',
			createdAt: now,
			updatedAt: now,
		},
		{
			id: SPOT_IDS[1],
			name: 'River Bend',
			lat: 52.5210,
			lng: 13.4060,
			notes: 'Deep pool, good for Pike',
			createdAt: now,
			updatedAt: now,
		},
	]);

	await db.insert(schema.spotTag).values([
		{ id: 'stag-0001', spotId: SPOT_IDS[0], name: 'lake' },
		{ id: 'stag-0002', spotId: SPOT_IDS[1], name: 'river' },
	]);

	// Catches — positioned very close to SPOT_IDS[0] (within 100m) for proximity linking
	await db.insert(schema.fishCatch).values([
		{
			id: CATCH_IDS[0],
			species: 'Pike',
			weightG: 1800,
			lengthCm: 62,
			lat: 52.5201,
			lng: 13.4051,
			lureId: LURE_IDS[0],
			catchAndRelease: false,
			presentation: 'Slow retrieve',
			biteIndex: 7.5,
			caughtAt: now,
			createdAt: now,
			updatedAt: now,
		},
		{
			id: CATCH_IDS[1],
			species: 'Perch',
			weightG: 450,
			lengthCm: 28,
			lureId: LURE_IDS[1],
			catchAndRelease: true,
			caughtAt: new Date(now.getTime() - 86_400_000),
			createdAt: now,
			updatedAt: now,
		},
	]);

	// Rod, reel, line, combo
	await db.insert(schema.rod).values([{
		id: 'rod-00000000-0000-0000-0001',
		brand: 'Shimano',
		model: 'Test Rod',
		lengthM: 2.7,
		type: 'Spinning',
		createdAt: now,
		updatedAt: now,
	}]);

	await db.insert(schema.reel).values([{
		id: 'reel-0000-0000-0000-0001',
		brand: 'Daiwa',
		model: 'Test Reel',
		size: '2500',
		createdAt: now,
		updatedAt: now,
	}]);

	await db.insert(schema.fishingLine).values([{
		id: 'line-0000-0000-0000-0001',
		brand: 'Sunline',
		model: 'FC Rock Hunter',
		type: 'Fluoro',
		diameterMm: 0.26,
		strengthKg: 5.2,
		createdAt: now,
		updatedAt: now,
	}]);

	await db.insert(schema.combo).values([{
		id: 'combo-000-0000-0000-0001',
		name: 'Pike Setup',
		rodId: 'rod-00000000-0000-0000-0001',
		reelId: 'reel-0000-0000-0000-0001',
		createdAt: now,
		updatedAt: now,
	}]);

	sqlite.close();
}
