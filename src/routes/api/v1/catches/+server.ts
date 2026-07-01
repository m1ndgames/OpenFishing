import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { fishCatch } from '$lib/server/db/schema';
import { userFilter } from '$lib/server/scope';

export const GET: RequestHandler = async ({ locals }) => {
	const catches = await db.query.fishCatch.findMany({
		where: userFilter(locals, fishCatch.userId),
		with: { lure: true }
	});

	return json(catches.map(({ lure, userId: _u, ...c }) => ({
		...c,
		lure: lure ? { id: lure.id, name: lure.name } : null
	})));
};
