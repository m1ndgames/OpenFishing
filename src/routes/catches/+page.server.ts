import type { PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { fishCatch, catchPhoto } from '#lib/server/db/schema.js';
import { desc, asc } from 'drizzle-orm';
import { userFilter } from '#lib/server/scope.js';

export const load: PageServerLoad = async ({ locals }) => {
	const catches = await db.query.fishCatch.findMany({
		where: userFilter(locals, fishCatch.userId),
		orderBy: [desc(fishCatch.caughtAt)],
		with: {
			photos: { orderBy: [asc(catchPhoto.sortOrder)], limit: 1 },
			lure: true
		}
	});
	return { catches };
};
