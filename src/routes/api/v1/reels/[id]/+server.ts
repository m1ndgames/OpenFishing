import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';
import { reel, reelLineLog } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ params }) => {
	const found = await db.select().from(reel).where(eq(reel.id, params.id)).limit(1);
	if (!found[0]) error(404, 'Reel not found');

	const latest = await db.query.reelLineLog.findFirst({
		where: eq(reelLineLog.reelId, params.id),
		orderBy: [desc(reelLineLog.spooledAt)],
		with: { line: true }
	});

	return json({
		...found[0],
		currentLine: latest ? {
			lineId: latest.lineId,
			brand: latest.line?.brand ?? null,
			model: latest.line?.model ?? null,
			type: latest.line?.type ?? null,
			spooledAt: latest.spooledAt
		} : null
	});
};
