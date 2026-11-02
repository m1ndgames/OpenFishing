import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/index.js';
import { lure as lureTable } from '#lib/server/db/schema.js';
import { and, eq } from 'drizzle-orm';
import { userFilter } from '#lib/server/scope.js';

export const GET: RequestHandler = async ({ params, locals }) => {
	const lure = await db.query.lure.findFirst({
		where: and(eq(lureTable.id, params.id), userFilter(locals, lureTable.userId)),
		with: { tags: true }
	});

	if (!lure) error(404, 'Lure not found');

	const { photoPath: _p, userId: _u, ...rest } = lure;
	return json({ ...rest, tags: rest.tags.map((t) => t.name) });
};
