import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '#lib/server/db/index.js';
import { lure } from '#lib/server/db/schema.js';
import { userFilter } from '#lib/server/scope.js';

export const GET: RequestHandler = async ({ locals }) => {
	const lures = await db.query.lure.findMany({
		where: userFilter(locals, lure.userId),
		with: { tags: true }
	});

	return json(lures.map(({ photoPath: _p, userId: _u, ...l }) => ({
		...l,
		tags: l.tags.map((t) => t.name)
	})));
};
