import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { desc } from 'drizzle-orm';
import { rod } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const rods = await db.select().from(rod).orderBy(desc(rod.createdAt));
	return json(rods);
};
