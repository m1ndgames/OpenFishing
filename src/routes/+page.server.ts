import type { PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { fishCatch, lure } from '#lib/server/db/schema.js';
import { and, count, isNotNull } from 'drizzle-orm';
import { userFilter } from '#lib/server/scope.js';

export const load: PageServerLoad = async ({ locals }) => {
	const [lures, catchRows] = await Promise.all([
		db.query.lure.findMany({
			where: userFilter(locals, lure.userId),
			with: { tags: true },
			orderBy: (lure, { asc }) => [asc(lure.lureNumber)]
		}),
		db.select({ lureId: fishCatch.lureId, n: count() })
			.from(fishCatch)
			.where(and(isNotNull(fishCatch.lureId), userFilter(locals, fishCatch.userId)))
			.groupBy(fishCatch.lureId)
	]);

	// Catch count per lure: drives the card badge and the "has catch" filter.
	const catchCounts: Record<string, number> = {};
	for (const r of catchRows) if (r.lureId) catchCounts[r.lureId] = Number(r.n) || 0;

	return { lures, catchCounts, lureIdsWithCatches: Object.keys(catchCounts) };
};
