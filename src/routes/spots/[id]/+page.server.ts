import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { spot, spotPhoto, fishCatch, catchPhoto } from '$lib/server/db/schema';
import { eq, asc, isNotNull, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { fetchWeather } from '$lib/server/biteIndex';
import { userFilter } from '$lib/server/scope';

import { haversineMeters } from '$lib/server/haversine';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [found, allSpots, allCatches] = await Promise.all([
		db.query.spot.findFirst({
			where: and(eq(spot.id, params.id), userFilter(locals, spot.userId)),
			with: {
				tags: true,
				photos: { orderBy: [asc(spotPhoto.sortOrder)] }
			}
		}),
		db.select({ id: spot.id, lat: spot.lat, lng: spot.lng }).from(spot).where(userFilter(locals, spot.userId)),
		db.query.fishCatch.findMany({
			where: and(isNotNull(fishCatch.lat), userFilter(locals, fishCatch.userId)),
			with: {
				lure: true,
				photos: { orderBy: [asc(catchPhoto.sortOrder)], limit: 1 }
			}
		})
	]);

	if (!found) error(404, 'Spot not found');

	const weather = await fetchWeather(found.lat, found.lng);

	const nearbyCatches = allCatches.filter((c) => {
		if (c.lat === null || c.lng === null) return false;
		// Find the nearest spot for this catch
		let nearestId = '';
		let nearestDist = Infinity;
		for (const s of allSpots) {
			const d = haversineMeters(c.lat, c.lng, s.lat, s.lng);
			if (d < nearestDist) { nearestDist = d; nearestId = s.id; }
		}
		return nearestId === params.id && nearestDist < 100;
	});

	// Sort newest first
	nearbyCatches.sort((a, b) => new Date(b.caughtAt).getTime() - new Date(a.caughtAt).getTime());

	const baseUrl = env.BASE_URL ?? 'http://localhost:5173';
	const authEnabled = !!env.AUTH_PASSWORD;
	const shareUrl = found.shareToken ? `${baseUrl}/share/spots/${found.shareToken}` : null;

	return { spot: found, nearbyCatches, weather, authEnabled, shareUrl };
};
