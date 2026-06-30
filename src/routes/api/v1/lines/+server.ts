import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { desc } from 'drizzle-orm';
import { fishingLine } from '$lib/server/db/schema';
import { userFilter } from '$lib/server/scope';

export const GET: RequestHandler = async ({ locals }) => {
	const lines = await db.select().from(fishingLine).where(userFilter(locals, fishingLine.userId)).orderBy(desc(fishingLine.createdAt));
	return json(lines.map(({ userId: _u, ...l }) => l));
};
