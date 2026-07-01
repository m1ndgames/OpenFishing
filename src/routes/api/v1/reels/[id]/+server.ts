import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { eq, desc, and } from 'drizzle-orm';
import { reel, reelLineLog } from '$lib/server/db/schema';
import { userFilter } from '$lib/server/scope';

export const GET: RequestHandler = async ({ params, locals }) => {
	const found = await db.select().from(reel).where(and(eq(reel.id, params.id), userFilter(locals, reel.userId))).limit(1);
	if (!found[0]) error(404, 'Reel not found');

	const latest = await db.query.reelLineLog.findFirst({
		where: eq(reelLineLog.reelId, params.id),
		orderBy: [desc(reelLineLog.spooledAt)],
		with: { line: true }
	});

	const { userId: _u, ...rest } = found[0];
	return json({
		...rest,
		currentLine: latest ? {
			lineId: latest.lineId,
			brand: latest.line?.brand ?? null,
			model: latest.line?.model ?? null,
			type: latest.line?.type ?? null,
			spooledAt: latest.spooledAt
		} : null
	});
};
