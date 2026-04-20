import { mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { env } from '$env/dynamic/private';
import sharp from 'sharp';

export const UPLOAD_DIR = env.UPLOAD_PATH ?? './uploads';

export async function deleteUpload(filename: string): Promise<void> {
	try {
		await unlink(join(UPLOAD_DIR, filename));
	} catch {
		// File already gone — not an error
	}
}

export async function saveUpload(file: File): Promise<string> {
	const filename = `${crypto.randomUUID()}.jpg`;
	await mkdir(UPLOAD_DIR, { recursive: true });
	const buffer = Buffer.from(await file.arrayBuffer());
	await sharp(buffer)
		.rotate()
		.resize(1920, 1920, { fit: 'inside', withoutEnlargement: true })
		.jpeg({ quality: 85 })
		.toFile(join(UPLOAD_DIR, filename));
	return filename;
}
