import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { combo, rod, reel } from '$lib/server/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [found, rods, reels] = await Promise.all([
		db.query.combo.findFirst({ where: and(eq(combo.id, params.id), userFilter(locals, combo.userId)), with: { rod: true, reel: true } }),
		db.select().from(rod).where(userFilter(locals, rod.userId)).orderBy(asc(rod.model)),
		db.select().from(reel).where(userFilter(locals, reel.userId)).orderBy(asc(reel.model))
	]);
	if (!found) error(404, 'Combo not found');
	return { combo: found, rods, reels };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		const rodId = (data.get('rod_id') as string)?.trim() || null;
		const reelId = (data.get('reel_id') as string)?.trim() || null;
		const terminalTackle = (data.get('terminal_tackle') as string)?.trim() || null;
		const notes = (data.get('notes') as string)?.trim() || null;

		if (!name) return fail(400, { error: 'comboNameRequired' });

		await db.update(combo).set({ name, rodId, reelId, terminalTackle, notes, updatedAt: new Date() }).where(and(eq(combo.id, params.id), userFilter(locals, combo.userId)));
		redirect(303, `/tackle/combos/${params.id}`);
	},

	delete: async ({ params, locals }) => {
		await db.delete(combo).where(and(eq(combo.id, params.id), userFilter(locals, combo.userId)));
		redirect(303, '/tackle');
	}
};
