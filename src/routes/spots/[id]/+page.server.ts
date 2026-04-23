import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { spot, spotPhoto, fishCatch, catchPhoto } from '$lib/server/db/schema';
import { eq, asc, isNotNull } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

function getMoonPhaseIndex(date: Date): number {
	const reference = new Date('2000-01-06T18:14:00Z').getTime();
	const lunarCycleDays = 29.53058867;
	const elapsed = (date.getTime() - reference) / 86_400_000;
	const phase = ((elapsed % lunarCycleDays) + lunarCycleDays) % lunarCycleDays;
	return Math.floor(((phase / lunarCycleDays) + 1 / 16) * 8) % 8;
}

type LightingKey = 'night' | 'dawn' | 'morning' | 'day' | 'golden' | 'dusk';

function getLightingKey(now: Date, sunriseStr: string, sunsetStr: string): LightingKey {
	if (!sunriseStr || !sunsetStr) return 'day';
	const nowMs = now.getTime();
	const riseMs = new Date(sunriseStr).getTime();
	const setMs  = new Date(sunsetStr).getTime();
	const hr = 3_600_000;
	if (nowMs < riseMs - hr)     return 'night';
	if (nowMs < riseMs)          return 'dawn';
	if (nowMs < riseMs + 2 * hr) return 'morning';
	if (nowMs < setMs - hr)      return 'day';
	if (nowMs < setMs)           return 'golden';
	if (nowMs < setMs + hr)      return 'dusk';
	return 'night';
}

async function fetchWeather(lat: number, lng: number) {
	try {
		const url =
			`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}` +
			`&current=temperature_2m,relative_humidity_2m,pressure_msl` +
			`&hourly=temperature_2m,pressure_msl` +
			`&daily=sunrise,sunset&timezone=auto&forecast_days=1&past_hours=3`;
		const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
		if (!res.ok) return null;
		const json = await res.json();
		const now = new Date();

		// Derive 3h trend from hourly data
		const times: string[]         = json.hourly?.time ?? [];
		const hourlyPressure: number[] = json.hourly?.pressure_msl ?? [];
		const hourlyTemp: number[]     = json.hourly?.temperature_2m ?? [];
		const threeAgo = now.getTime() - 3 * 3_600_000;

		let oldIdx = 0, minDiff = Infinity;
		for (let i = 0; i < times.length; i++) {
			const d = Math.abs(new Date(times[i]).getTime() - threeAgo);
			if (d < minDiff) { minDiff = d; oldIdx = i; }
		}
		let nowIdx = 0;
		for (let i = 0; i < times.length; i++) {
			if (new Date(times[i]).getTime() <= now.getTime()) nowIdx = i;
		}

		const pressureNow  = (json.current?.pressure_msl ?? hourlyPressure[nowIdx]) as number;
		const pressureThen = (hourlyPressure[oldIdx] ?? pressureNow) as number;
		const tempNow      = (json.current?.temperature_2m ?? hourlyTemp[nowIdx]) as number;
		const tempThen     = (hourlyTemp[oldIdx] ?? tempNow) as number;

		const pressureDelta = Math.round((pressureNow - pressureThen) * 10) / 10;
		const tempDelta     = Math.abs(tempNow - tempThen);

		const lightingKey = getLightingKey(now, json.daily?.sunrise?.[0] ?? '', json.daily?.sunset?.[0] ?? '');

		// Bite index
		const pScore = pressureDelta < -1.5 ? 10 : pressureDelta <= 1.5 ? 7 : 2;
		const lScore = (lightingKey === 'dawn' || lightingKey === 'dusk') ? 10
		             : lightingKey === 'golden'  ? 8
		             : (lightingKey === 'night' || lightingKey === 'morning') ? 6
		             : 2;
		const tScore = tempDelta >= 3 ? 2 : 10;
		const biteIndex = Math.round((pScore * 0.5 + lScore * 0.3 + tScore * 0.2) * 10) / 10;

		return {
			temperature:    json.current?.temperature_2m ?? null as number | null,
			humidity:       json.current?.relative_humidity_2m ?? null as number | null,
			pressure:       pressureNow != null ? Math.round(pressureNow) : null as number | null,
			pressureDelta,
			tempDelta:      Math.round(tempDelta * 10) / 10,
			moonPhaseIndex: getMoonPhaseIndex(now),
			lightingKey,
			biteIndex,
			biteScores:     { pressure: pScore, light: lScore, temp: tScore },
		};
	} catch {
		return null;
	}
}

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
