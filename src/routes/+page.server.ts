import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishCatch, lure } from '$lib/server/db/schema';
import { and, isNotNull } from 'drizzle-orm';
import { userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ locals }) => {
	const [lures, catchRows] = await Promise.all([
		db.query.lure.findMany({
			where: userFilter(locals, lure.userId),
			with: { tags: true },
			orderBy: (lure, { asc }) => [asc(lure.lureNumber)]
		}),
		db.selectDistinct({ lureId: fishCatch.lureId })
			.from(fishCatch)
			.where(and(isNotNull(fishCatch.lureId), userFilter(locals, fishCatch.userId)))
	]);

	const lureIdsWithCatches = new Set(catchRows.map(r => r.lureId as string));

	return { lures, lureIdsWithCatches: [...lureIdsWithCatches] };
};
