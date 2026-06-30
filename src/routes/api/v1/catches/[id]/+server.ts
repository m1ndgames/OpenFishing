import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { fishCatch as fishCatchTable } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { userFilter } from '$lib/server/scope';

export const GET: RequestHandler = async ({ params, locals }) => {
	const fishCatch = await db.query.fishCatch.findFirst({
		where: and(eq(fishCatchTable.id, params.id), userFilter(locals, fishCatchTable.userId)),
		with: { lure: true }
	});

	if (!fishCatch) error(404, 'Catch not found');

	const { lure, userId: _u, ...rest } = fishCatch;
	return json({ ...rest, lure: lure ? { id: lure.id, name: lure.name } : null });
};
