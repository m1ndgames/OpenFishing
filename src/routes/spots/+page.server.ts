import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { spot, spotPhoto, fishCatch } from '$lib/server/db/schema';
import { and, asc, isNotNull } from 'drizzle-orm';
import { userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ locals }) => {
	const [spots, catches] = await Promise.all([
		db.query.spot.findMany({
			where: userFilter(locals, spot.userId),
			orderBy: [asc(spot.createdAt)],
			with: {
				tags: true,
				photos: { orderBy: [asc(spotPhoto.sortOrder)], limit: 1 }
			}
		}),
		db.select({
			id: fishCatch.id,
			lat: fishCatch.lat,
			lng: fishCatch.lng,
			species: fishCatch.species,
			caughtAt: fishCatch.caughtAt
		}).from(fishCatch).where(and(isNotNull(fishCatch.lat), userFilter(locals, fishCatch.userId)))
	]);
	return { spots, catches };
};
