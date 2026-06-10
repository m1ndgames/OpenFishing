import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const spot = await db.query.spot.findFirst({
		where: (s, { eq }) => eq(s.id, params.id),
		with: { tags: true }
	});

	if (!spot) error(404, 'Spot not found');

	return json({ ...spot, tags: spot.tags.map((t) => t.name) });
};
