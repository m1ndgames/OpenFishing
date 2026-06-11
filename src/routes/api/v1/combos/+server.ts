import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { desc } from 'drizzle-orm';
import { combo, reelLineLog } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const [combos, allLogs] = await Promise.all([
		db.query.combo.findMany({
			orderBy: [desc(combo.createdAt)],
			with: { rod: true, reel: true }
		}),
		db.query.reelLineLog.findMany({
			with: { line: true },
			orderBy: [desc(reelLineLog.spooledAt)]
		})
	]);

	const currentByReel = new Map<string, typeof allLogs[number]>();
	for (const log of allLogs) {
		if (!currentByReel.has(log.reelId)) currentByReel.set(log.reelId, log);
	}

	return json(combos.map(({ rod: r, reel: re, ...c }) => {
		const log = re ? (currentByReel.get(re.id) ?? null) : null;
		return {
			...c,
			rod: r ? { id: r.id, brand: r.brand, model: r.model, type: r.type } : null,
			reel: re ? { id: re.id, brand: re.brand, model: re.model, size: re.size } : null,
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
