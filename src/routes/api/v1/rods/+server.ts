import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { desc } from 'drizzle-orm';
import { rod } from '$lib/server/db/schema';
import { userFilter } from '$lib/server/scope';

export const GET: RequestHandler = async ({ locals }) => {
	const rods = await db.select().from(rod).where(userFilter(locals, rod.userId)).orderBy(desc(rod.createdAt));
	return json(rods.map(({ userId: _u, ...r }) => r));
};
