import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { reel } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const found = await db.select().from(reel).where(eq(reel.id, params.id)).limit(1);
	if (!found[0]) error(404, 'Reel not found');
	return { reel: found[0] };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const brand = (data.get('brand') as string)?.trim() || null;
		const model = (data.get('model') as string)?.trim();
		const size = (data.get('size') as string)?.trim() || null;
		const notes = (data.get('notes') as string)?.trim() || null;

		if (!model) return fail(400, { error: 'reelModelRequired' });

		await db.update(reel).set({ brand, model, size, notes, updatedAt: new Date() }).where(eq(reel.id, params.id));
		redirect(303, `/tackle/reels/${params.id}`);
	},

	delete: async ({ params }) => {
		await db.delete(reel).where(eq(reel.id, params.id));
		redirect(303, '/tackle');
	}
};
