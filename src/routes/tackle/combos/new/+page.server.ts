import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { combo, rod, reel } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const [rods, reels] = await Promise.all([
		db.select().from(rod).orderBy(asc(rod.model)),
		db.select().from(reel).orderBy(asc(reel.model))
	]);
	return { rods, reels };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const rodId = (data.get('rod_id') as string)?.trim() || null;
		const reelId = (data.get('reel_id') as string)?.trim() || null;
		const terminalTackle = (data.get('terminal_tackle') as string)?.trim() || null;
		const notes = (data.get('notes') as string)?.trim() || null;

		if (!name) return fail(400, { error: 'comboNameRequired' });

		const [newCombo] = await db.insert(combo).values({ name, rodId, reelId, terminalTackle, notes }).returning();
		redirect(303, `/tackle/combos/${newCombo.id}`);
	}
};
