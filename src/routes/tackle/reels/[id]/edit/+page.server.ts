import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { reel } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ params, locals }) => {
	const found = await db.select().from(reel).where(and(eq(reel.id, params.id), userFilter(locals, reel.userId))).limit(1);
	if (!found[0]) error(404, 'Reel not found');
	return { reel: found[0] };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const data = await request.formData();
		const brand = (data.get('brand') as string)?.trim() || null;
		const model = (data.get('model') as string)?.trim();
		const size = (data.get('size') as string)?.trim() || null;
		const notes = (data.get('notes') as string)?.trim() || null;

		if (!model) return fail(400, { error: 'reelModelRequired' });

		await db.update(reel).set({ brand, model, size, notes, updatedAt: new Date() }).where(and(eq(reel.id, params.id), userFilter(locals, reel.userId)));
		redirect(303, `/tackle/reels/${params.id}`);
	},

	delete: async ({ params, locals }) => {
		await db.delete(reel).where(and(eq(reel.id, params.id), userFilter(locals, reel.userId)));
		redirect(303, '/tackle');
	}
};
