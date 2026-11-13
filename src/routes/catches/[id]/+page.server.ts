import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { fishCatch, catchPhoto, spot } from '#lib/server/db/schema.js';
import { eq, asc, and, lte } from 'drizzle-orm';
import { catchHighlights } from '#lib/catchHighlights.js';
import { env } from '#lib/server/env.js';
import { userFilter } from '#lib/server/scope.js';
import { authEnabled as isAuthEnabled } from '#lib/server/auth.js';

import { haversineMeters } from '#lib/server/haversine.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [found, allSpots] = await Promise.all([
		db.query.fishCatch.findFirst({
			where: and(eq(fishCatch.id, params.id), userFilter(locals, fishCatch.userId)),
			with: {
				photos: { orderBy: [asc(catchPhoto.sortOrder)] },
				lure: true,
				combo: { with: { rod: true, reel: true } }
			}
		}),
		db.select({ id: spot.id, name: spot.name, lat: spot.lat, lng: spot.lng }).from(spot).where(userFilter(locals, spot.userId))
	]);

	if (!found) error(404, 'Catch not found');

	let nearbySpot: { id: string; name: string } | null = null;
	if (found.lat !== null && found.lng !== null) {
		let nearestDist = Infinity;
		let nearest: { id: string; name: string } | null = null;
		for (const s of allSpots) {
			const d = haversineMeters(found.lat, found.lng, s.lat, s.lng);
			if (d < nearestDist) { nearestDist = d; nearest = s; }
		}
		if (nearest && nearestDist < 100) nearbySpot = nearest;
	}

	// Highlights: personal best within the species, and which fish this was on its lure.
	const [sameSpecies, lureCatches] = await Promise.all([
		found.species
			? db.select({ id: fishCatch.id, lengthCm: fishCatch.lengthCm, weightG: fishCatch.weightG })
				.from(fishCatch)
				.where(and(eq(fishCatch.species, found.species), userFilter(locals, fishCatch.userId)))
			: Promise.resolve([]),
		found.lureId && found.caughtAt
			? db.select({ id: fishCatch.id })
				.from(fishCatch)
				.where(and(
					eq(fishCatch.lureId, found.lureId),
					lte(fishCatch.caughtAt, found.caughtAt),
					userFilter(locals, fishCatch.userId)
				))
			: Promise.resolve([])
	]);
	const highlights = catchHighlights(
		found,
		sameSpecies,
		found.lureId ? lureCatches.length : null
	);

	const baseUrl = env.BASE_URL ?? 'http://localhost:5173';
	const authEnabled = isAuthEnabled();
	const shareUrl = found.shareToken ? `${baseUrl}/share/catches/${found.shareToken}` : null;

	return { catch: found, nearbySpot, highlights, authEnabled, shareUrl };
};
