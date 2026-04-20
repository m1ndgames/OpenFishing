import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async () => {
	const lures = await db.query.lure.findMany({
		with: { tags: true },
		orderBy: (lure, { asc }) => [asc(lure.lureNumber)]
	});

	return { lures };
};
