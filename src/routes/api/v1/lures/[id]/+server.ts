import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const lure = await db.query.lure.findFirst({
		where: (l, { eq }) => eq(l.id, params.id),
		with: { tags: true }
	});

	if (!lure) error(404, 'Lure not found');

	const { photoPath: _, ...rest } = lure;
	return json({ ...rest, tags: rest.tags.map((t) => t.name) });
};
