import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { combo, rod, reel } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import { ownerId, userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ locals }) => {
	const [rods, reels] = await Promise.all([
		db.select().from(rod).where(userFilter(locals, rod.userId)).orderBy(asc(rod.model)),
		db.select().from(reel).where(userFilter(locals, reel.userId)).orderBy(asc(reel.model))
	]);
	return { rods, reels };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const rodId = (data.get('rod_id') as string)?.trim() || null;
		const reelId = (data.get('reel_id') as string)?.trim() || null;
		const terminalTackle = (data.get('terminal_tackle') as string)?.trim() || null;
		const notes = (data.get('notes') as string)?.trim() || null;

		if (!name) return fail(400, { error: 'comboNameRequired' });

		const [newCombo] = await db.insert(combo).values({ userId: ownerId(locals), name, rodId, reelId, terminalTackle, notes }).returning();
		redirect(303, `/tackle/combos/${newCombo.id}`);
	}
};
