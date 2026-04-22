import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishCatch, spot } from '$lib/server/db/schema';

function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
	const R = 6_371_000;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(lat2 - lat1);
	const dLng = toRad(lng2 - lng1);
	const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
	return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const load: PageServerLoad = async () => {
	const [catches, spots] = await Promise.all([
		db.query.fishCatch.findMany({ with: { lure: true } }),
		db.select({ id: spot.id, name: spot.name, lat: spot.lat, lng: spot.lng }).from(spot)
	]);

	// ── Totals ───────────────────────────────────────────────────────────────
	const totalCatches  = catches.length;
	const cnrCount      = catches.filter(c => c.catchAndRelease).length;
	const cnrRate       = totalCatches > 0 ? Math.round((cnrCount / totalCatches) * 100) : 0;
	const distinctSpecies = new Set(catches.map(c => c.species).filter(Boolean)).size;

	// ── Personal bests per species ────────────────────────────────────────────
	const speciesMap = new Map<string, { count: number; maxLength: number | null; maxLengthId: string | null; maxWeight: number | null; maxWeightId: string | null; cnr: number }>();
	for (const c of catches) {
		if (!c.species) continue;
		const s = speciesMap.get(c.species) ?? { count: 0, maxLength: null, maxLengthId: null, maxWeight: null, maxWeightId: null, cnr: 0 };
		s.count++;
		if (c.catchAndRelease) s.cnr++;
		if (c.lengthCm != null && (s.maxLength === null || c.lengthCm > s.maxLength)) { s.maxLength = c.lengthCm; s.maxLengthId = c.id; }
		if (c.weightG  != null && (s.maxWeight === null || c.weightG  > s.maxWeight)) { s.maxWeight = c.weightG;  s.maxWeightId = c.id; }
		speciesMap.set(c.species, s);
	}
	const speciesStats = [...speciesMap.entries()]
		.map(([species, s]) => ({ species, ...s }))
		.sort((a, b) => b.count - a.count);

	// ── Lure performance ──────────────────────────────────────────────────────
	const lureMap = new Map<string, { name: string; lureNumber: number | null; brand: string | null; count: number; cnr: number }>();
	for (const c of catches) {
		if (!c.lure) continue;
		const e = lureMap.get(c.lure.id) ?? { name: c.lure.name, lureNumber: c.lure.lureNumber, brand: c.lure.brand, count: 0, cnr: 0 };
		e.count++;
		if (c.catchAndRelease) e.cnr++;
		lureMap.set(c.lure.id, e);
	}
	const lureStats = [...lureMap.values()].sort((a, b) => b.count - a.count).slice(0, 8);

	// ── Spot productivity ─────────────────────────────────────────────────────
	const spotCountMap = new Map<string, number>();
	for (const c of catches) {
		if (c.lat === null || c.lng === null) continue;
		let nearestId = '', nearestDist = Infinity;
		for (const s of spots) {
			const d = haversineMeters(c.lat, c.lng, s.lat, s.lng);
			if (d < nearestDist) { nearestDist = d; nearestId = s.id; }
		}
		if (nearestId && nearestDist < 100) {
			spotCountMap.set(nearestId, (spotCountMap.get(nearestId) ?? 0) + 1);
		}
	}
	const spotStats = spots
		.map(s => ({ id: s.id, name: s.name, count: spotCountMap.get(s.id) ?? 0 }))
		.filter(s => s.count > 0)
		.sort((a, b) => b.count - a.count)
		.slice(0, 6);

	// ── Monthly activity (last 12 months) ────────────────────────────────────
	const now = new Date();
	const months = Array.from({ length: 12 }, (_, i) => {
		const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
		return { year: d.getFullYear(), month: d.getMonth(), count: 0 };
	});
	for (const c of catches) {
		const d = new Date(c.caughtAt);
		const entry = months.find(m => m.year === d.getFullYear() && m.month === d.getMonth());
		if (entry) entry.count++;
	}

	// ── Time of day (individual hours) ───────────────────────────────────────
	const hourly = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
	for (const c of catches) hourly[new Date(c.caughtAt).getHours()].count++;

	// ── Day of week (Mon–Sun) ─────────────────────────────────────────────────
	const weekdays = Array.from({ length: 7 }, (_, day) => ({ day, count: 0 }));
	for (const c of catches) weekdays[new Date(c.caughtAt).getDay()].count++;
	// Reorder Sun(0)→last: [Mon(1)..Sat(6), Sun(0)]
	const weekdaysOrdered = [...weekdays.slice(1), weekdays[0]];

	// ── Retrieve style (Köderführung) ─────────────────────────────────────────
	const presentationMap = new Map<string, number>();
	for (const c of catches) {
		if (!c.presentation) continue;
		presentationMap.set(c.presentation, (presentationMap.get(c.presentation) ?? 0) + 1);
	}
	const presentationStats = [...presentationMap.entries()]
		.map(([style, count]) => ({ style, count }))
		.sort((a, b) => b.count - a.count);

	return {
		totals: { totalCatches, cnrCount, cnrRate, distinctSpecies, totalSpots: spots.length },
		speciesStats,
		lureStats,
		spotStats,
		months,
		hourly,
		weekdays: weekdaysOrdered,
		presentationStats,
	};
};
