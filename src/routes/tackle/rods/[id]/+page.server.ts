import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { rod, combo } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ params, locals }) => {
	const found = await db.select().from(rod).where(and(eq(rod.id, params.id), userFilter(locals, rod.userId))).limit(1);
	if (!found[0]) error(404, 'Rod not found');

	const combos = await db.query.combo.findMany({
		where: and(eq(combo.rodId, params.id), userFilter(locals, combo.userId)),
		with: { reel: true }
	});

	return { rod: found[0], combos };
};
