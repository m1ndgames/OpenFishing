import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { rod, reel, fishingLine, combo, reelLineLog } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import { userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ locals }) => {
	const [rods, reels, lines, combos] = await Promise.all([
		db.select().from(rod).where(userFilter(locals, rod.userId)).orderBy(desc(rod.createdAt)),
		db.select().from(reel).where(userFilter(locals, reel.userId)).orderBy(desc(reel.createdAt)),
		db.select().from(fishingLine).where(userFilter(locals, fishingLine.userId)).orderBy(desc(fishingLine.createdAt)),
		db.query.combo.findMany({
			where: userFilter(locals, combo.userId),
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
