import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { rod } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const found = await db.select().from(rod).where(eq(rod.id, params.id)).limit(1);
	if (!found[0]) error(404, 'Rod not found');
	return { rod: found[0] };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();
		const brand = (data.get('brand') as string)?.trim() || null;
		const model = (data.get('model') as string)?.trim();
		const lengthRaw = (data.get('length_m') as string)?.trim();
		const castingWeight = (data.get('casting_weight') as string)?.trim() || null;
		const type = (data.get('type') as string)?.trim() || null;
		const notes = (data.get('notes') as string)?.trim() || null;

		if (!model) return fail(400, { error: 'rodModelRequired' });

		const lengthM = lengthRaw ? parseFloat(lengthRaw) : null;

		await db.update(rod).set({ brand, model, lengthM, castingWeight, type, notes, updatedAt: new Date() }).where(eq(rod.id, params.id));
		redirect(303, `/tackle/rods/${params.id}`);
	},

	delete: async ({ params }) => {
		await db.delete(rod).where(eq(rod.id, params.id));
		redirect(303, '/tackle');
	}
};
