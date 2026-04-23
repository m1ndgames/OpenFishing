import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishCatch, catchPhoto, spot } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

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
	const [found, allSpots] = await Promise.all([
		db.query.fishCatch.findFirst({
			where: eq(fishCatch.id, params.id),
			with: {
				photos: { orderBy: [asc(catchPhoto.sortOrder)] },
				lure: true
			}
		}),
		db.select({ id: spot.id, name: spot.name, lat: spot.lat, lng: spot.lng }).from(spot)
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
	const authEnabled = !!env.AUTH_PASSWORD;
	const shareUrl = found.shareToken ? `${baseUrl}/share/catches/${found.shareToken}` : null;

	return { catch: found, nearbySpot, authEnabled, shareUrl };
};
