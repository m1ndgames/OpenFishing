import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { fishingLine, reelLineLog } from '#lib/server/db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { userFilter } from '#lib/server/scope.js';

export const load: PageServerLoad = async ({ params, locals }) => {
	const found = await db.select().from(fishingLine).where(and(eq(fishingLine.id, params.id), userFilter(locals, fishingLine.userId))).limit(1);
	if (!found[0]) error(404, 'Line not found');

	const logs = await db.query.reelLineLog.findMany({
		where: eq(reelLineLog.lineId, params.id),
		orderBy: [desc(reelLineLog.spooledAt)],
		with: { reel: true }
	});

	return { line: found[0], logs };
};
