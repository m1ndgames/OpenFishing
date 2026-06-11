import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { rod, combo } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const found = await db.select().from(rod).where(eq(rod.id, params.id)).limit(1);
	if (!found[0]) error(404, 'Rod not found');

	const combos = await db.query.combo.findMany({
		where: eq(combo.rodId, params.id),
		with: { reel: true }
	});

	return { rod: found[0], combos };
};
