import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { spot } from '$lib/server/db/schema';
import { userFilter } from '$lib/server/scope';

export const GET: RequestHandler = async ({ locals }) => {
	const spots = await db.query.spot.findMany({
		where: userFilter(locals, spot.userId),
		with: { tags: true }
	});

	return json(spots.map(({ userId: _u, ...s }) => ({
		...s,
		tags: s.tags.map((t) => t.name)
	})));
};
