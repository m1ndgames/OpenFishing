import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';

export const GET: RequestHandler = async () => {
	const catches = await db.query.fishCatch.findMany({
		with: { lure: true }
	});

	return json(catches.map(({ lure, ...c }) => ({
		...c,
		lure: lure ? { id: lure.id, name: lure.name } : null
	})));
};
