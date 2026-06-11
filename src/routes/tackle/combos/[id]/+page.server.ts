import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { combo, reelLineLog } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const found = await db.query.combo.findFirst({
		where: eq(combo.id, params.id),
		with: { rod: true, reel: true }
	});
	if (!found) error(404, 'Combo not found');

	let currentLine: { lineName: string; spooledAt: Date } | null = null;
	if (found.reelId) {
		const latest = await db.query.reelLineLog.findFirst({
			where: eq(reelLineLog.reelId, found.reelId),
			orderBy: [desc(reelLineLog.spooledAt)],
			with: { line: true }
		});
		if (latest?.line) {
			currentLine = {
				lineName: `${latest.line.brand ?? ''} ${latest.line.model}`.trim(),
				spooledAt: latest.spooledAt
			};
		}
	}

	return { combo: found, currentLine };
};
