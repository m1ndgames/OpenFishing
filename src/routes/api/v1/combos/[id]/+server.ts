import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eq, desc } from 'drizzle-orm';
import { combo, reelLineLog } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ params }) => {
	const found = await db.query.combo.findFirst({
		where: eq(combo.id, params.id),
		with: { rod: true, reel: true }
	});
	if (!found) error(404, 'Combo not found');

	const { rod: r, reel: re, ...c } = found;

	const latest = re ? await db.query.reelLineLog.findFirst({
		where: eq(reelLineLog.reelId, re.id),
		orderBy: [desc(reelLineLog.spooledAt)],
		with: { line: true }
	}) : null;

	return json({
		...c,
		rod: r ? { id: r.id, brand: r.brand, model: r.model, type: r.type } : null,
		reel: re ? { id: re.id, brand: re.brand, model: re.model, size: re.size } : null,
		currentLine: latest ? {
			lineId: latest.lineId,
			brand: latest.line?.brand ?? null,
			model: latest.line?.model ?? null,
			type: latest.line?.type ?? null,
			spooledAt: latest.spooledAt
		} : null
	});
};
