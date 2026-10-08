import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/index.js';
import { fishCatch as fishCatchTable } from '#lib/server/db/schema.js';
import { and, eq } from 'drizzle-orm';
import { userFilter } from '#lib/server/scope.js';

export const GET: RequestHandler = async ({ params, locals }) => {
	const fishCatch = await db.query.fishCatch.findFirst({
		where: and(eq(fishCatchTable.id, params.id), userFilter(locals, fishCatchTable.userId)),
		with: { lure: true }
	});

	if (!fishCatch) error(404, 'Catch not found');

	const { lure, userId: _u, ...rest } = fishCatch;
	return json({ ...rest, lure: lure ? { id: lure.id, name: lure.name } : null });
};
