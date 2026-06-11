import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { rod, reel, fishingLine, combo, reelLineLog } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const [rods, reels, lines, combos] = await Promise.all([
		db.select().from(rod).orderBy(desc(rod.createdAt)),
		db.select().from(reel).orderBy(desc(reel.createdAt)),
		db.select().from(fishingLine).orderBy(desc(fishingLine.createdAt)),
		db.query.combo.findMany({
			orderBy: [desc(combo.createdAt)],
			with: { rod: true, reel: true }
		})
	]);

	// For each reel, get the latest line log entry
	const reelCurrentLines: Record<string, { lineId: string | null; lineName: string | null; spooledAt: Date }> = {};
	for (const r of reels) {
		const latest = await db.query.reelLineLog.findFirst({
			where: eq(reelLineLog.reelId, r.id),
			orderBy: [desc(reelLineLog.spooledAt)],
			with: { line: true }
		});
		if (latest) {
			reelCurrentLines[r.id] = {
				lineId: latest.lineId,
				lineName: latest.line ? `${latest.line.brand ?? ''} ${latest.line.model}`.trim() : null,
				spooledAt: latest.spooledAt
			};
		}
	}

	return { rods, reels, lines, combos, reelCurrentLines };
};
