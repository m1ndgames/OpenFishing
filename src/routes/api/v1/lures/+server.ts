import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	const lures = await db.query.lure.findMany({
		with: { tags: true }
	});

	return json(lures.map(({ photoPath: _, ...l }) => ({
		...l,
		tags: l.tags.map((t) => t.name)
	})));
};
