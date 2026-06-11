import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { desc } from 'drizzle-orm';
import { reel, reelLineLog } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const [reels, allLogs] = await Promise.all([
		db.select().from(reel).orderBy(desc(reel.createdAt)),
		db.query.reelLineLog.findMany({
			with: { line: true },
			orderBy: [desc(reelLineLog.spooledAt)]
		})
	]);

	const currentByReel = new Map<string, typeof allLogs[number]>();
	for (const log of allLogs) {
		if (!currentByReel.has(log.reelId)) currentByReel.set(log.reelId, log);
	}

	return json(reels.map((r) => {
		const log = currentByReel.get(r.id) ?? null;
		return {
			...r,
			currentLine: log ? {
				lineId: log.lineId,
				brand: log.line?.brand ?? null,
				model: log.line?.model ?? null,
				type: log.line?.type ?? null,
				spooledAt: log.spooledAt
			} : null
		};
	}));
};
