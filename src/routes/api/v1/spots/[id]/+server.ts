import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { spot as spotTable } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { userFilter } from '$lib/server/scope';

export const GET: RequestHandler = async ({ params, locals }) => {
	const spot = await db.query.spot.findFirst({
		where: and(eq(spotTable.id, params.id), userFilter(locals, spotTable.userId)),
		with: { tags: true }
	});

	if (!spot) error(404, 'Spot not found');

	const { userId: _u, ...rest } = spot;
	return json({ ...rest, tags: rest.tags.map((t) => t.name) });
};
