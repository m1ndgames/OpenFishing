import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { fishingLine } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ params }) => {
	const found = await db.select().from(fishingLine).where(eq(fishingLine.id, params.id)).limit(1);
	if (!found[0]) error(404, 'Line not found');
	return json(found[0]);
};
