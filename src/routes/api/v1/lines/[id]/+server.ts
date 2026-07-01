import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { and, eq } from 'drizzle-orm';
import { fishingLine } from '$lib/server/db/schema';
import { userFilter } from '$lib/server/scope';

export const GET: RequestHandler = async ({ params, locals }) => {
	const found = await db.select().from(fishingLine).where(and(eq(fishingLine.id, params.id), userFilter(locals, fishingLine.userId))).limit(1);
	if (!found[0]) error(404, 'Line not found');
	const { userId: _u, ...rest } = found[0];
	return json(rest);
};
