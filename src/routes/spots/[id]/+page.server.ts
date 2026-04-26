import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { spot, spotPhoto, fishCatch, catchPhoto } from '$lib/server/db/schema';
import { eq, asc, isNotNull } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { fetchWeather } from '$lib/server/biteIndex';

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6_371_000;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const load: PageServerLoad = async ({ params }) => {
	const [found, allSpots, allCatches] = await Promise.all([
		db.query.spot.findFirst({
			where: eq(spot.id, params.id),
			with: {
				tags: true,
				photos: { orderBy: [asc(spotPhoto.sortOrder)] }
			}
		}),
		db.select({ id: spot.id, lat: spot.lat, lng: spot.lng }).from(spot),
		db.query.fishCatch.findMany({
			where: isNotNull(fishCatch.lat),
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
