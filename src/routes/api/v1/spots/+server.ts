import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	const spots = await db.query.spot.findMany({
		with: { tags: true }
	});

	return json(spots.map(({ ...s }) => ({
		...s,
		tags: s.tags.map((t) => t.name)
	})));
};
