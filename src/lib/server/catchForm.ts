import { and, asc, count, desc, isNotNull } from 'drizzle-orm';
import { db } from '#lib/server/db/index.js';
import { combo, fishCatch, lure, spot } from '#lib/server/db/schema.js';
import { userFilter } from '#lib/server/scope.js';
import { rankQuickLures } from '#lib/catchForm.js';

/**
 * Everything the catch new/edit forms need besides the catch itself:
 * - lures (with photo/favourite/lost for the picker) and combos
 * - quickLureIds: recently used + favourite lures offered as one-tap tiles
 * - presentationCounts: how often each retrieve style was used, to order the chips
 * - lastLocation: where to centre the map when geolocation is unavailable
 * - spots: saved spots the location can be taken from
 */
export async function loadCatchFormData(locals: App.Locals) {
	const mine = userFilter(locals, fishCatch.userId);
	const [lures, combos, recent, presentationRows, lastCatch, spots] = await Promise.all([
		db
			.select({ id: lure.id, lureNumber: lure.lureNumber, name: lure.name, photoPath: lure.photoPath, favourite: lure.favourite, lost: lure.lost })
			.from(lure)
			.where(userFilter(locals, lure.userId))
			.orderBy(asc(lure.lureNumber)),
		db.query.combo.findMany({ where: userFilter(locals, combo.userId), orderBy: [asc(combo.name)], with: { rod: true, reel: true } }),
		db
			.select({ lureId: fishCatch.lureId })
			.from(fishCatch)
			.where(and(mine, isNotNull(fishCatch.lureId)))
			.orderBy(desc(fishCatch.caughtAt))
			.limit(50),
		db
			.select({ presentation: fishCatch.presentation, n: count() })
			.from(fishCatch)
			.where(and(mine, isNotNull(fishCatch.presentation)))
			.groupBy(fishCatch.presentation),
		db
			.select({ lat: fishCatch.lat, lng: fishCatch.lng })
			.from(fishCatch)
			.where(and(mine, isNotNull(fishCatch.lat), isNotNull(fishCatch.lng)))
			.orderBy(desc(fishCatch.caughtAt))
			.limit(1),
		db.select({ id: spot.id, name: spot.name, lat: spot.lat, lng: spot.lng }).from(spot).where(userFilter(locals, spot.userId)).orderBy(asc(spot.name))
	]);

	const presentationCounts: Record<string, number> = {};
	for (const r of presentationRows) if (r.presentation) presentationCounts[r.presentation] = r.n;

	const last = lastCatch[0];
	const lastLocation =
		last?.lat != null && last?.lng != null
			? { lat: last.lat, lng: last.lng }
			: spots[0]
				? { lat: spots[0].lat, lng: spots[0].lng }
				: null;

	return {
		lures,
		combos,
		quickLureIds: rankQuickLures(lures, recent.map((r) => r.lureId)).map((l) => l.id),
		presentationCounts,
		lastLocation,
		spots
	};
}
