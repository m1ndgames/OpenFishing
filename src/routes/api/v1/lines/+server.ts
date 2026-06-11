import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { desc } from 'drizzle-orm';
import { fishingLine } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const lines = await db.select().from(fishingLine).orderBy(desc(fishingLine.createdAt));
	return json(lines);
};
