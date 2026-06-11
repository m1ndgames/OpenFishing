import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishingLine, reelLineLog } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const found = await db.select().from(fishingLine).where(eq(fishingLine.id, params.id)).limit(1);
	if (!found[0]) error(404, 'Line not found');

	const logs = await db.query.reelLineLog.findMany({
		where: eq(reelLineLog.lineId, params.id),
		orderBy: [desc(reelLineLog.spooledAt)],
		with: { reel: true }
	});

	return { line: found[0], logs };
};
