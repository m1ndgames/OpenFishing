import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishCatch, catchPhoto, spot } from '$lib/server/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { userFilter } from '$lib/server/scope';
import { authEnabled as isAuthEnabled } from '$lib/server/auth';

import { haversineMeters } from '$lib/server/haversine';

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

	const baseUrl = env.BASE_URL ?? 'http://localhost:5173';
	const authEnabled = isAuthEnabled();
	const shareUrl = found.shareToken ? `${baseUrl}/share/catches/${found.shareToken}` : null;

	return { catch: found, nearbySpot, authEnabled, shareUrl };
};
