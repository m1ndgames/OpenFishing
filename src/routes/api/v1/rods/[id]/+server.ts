import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eq } from 'drizzle-orm';
import { rod } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ params }) => {
	const found = await db.select().from(rod).where(eq(rod.id, params.id)).limit(1);
	if (!found[0]) error(404, 'Rod not found');
	return json(found[0]);
};
