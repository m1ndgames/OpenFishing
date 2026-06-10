import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async ({ params }) => {
	const fishCatch = await db.query.fishCatch.findFirst({
		where: (c, { eq }) => eq(c.id, params.id),
		with: { lure: true }
	});

	if (!fishCatch) error(404, 'Catch not found');

	const { lure, ...rest } = fishCatch;
	return json({ ...rest, lure: lure ? { id: lure.id, name: lure.name } : null });
};
