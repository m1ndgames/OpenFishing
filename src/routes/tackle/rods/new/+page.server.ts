import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { rod } from '$lib/server/db/schema';
import { ownerId } from '$lib/server/scope';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const brand = (data.get('brand') as string)?.trim() || null;
		const model = (data.get('model') as string)?.trim();
		const lengthRaw = (data.get('length_m') as string)?.trim();
		const castingWeight = (data.get('casting_weight') as string)?.trim() || null;
		const type = (data.get('type') as string)?.trim() || null;
		const notes = (data.get('notes') as string)?.trim() || null;

		if (!model) return fail(400, { error: 'rodModelRequired' });

		const lengthM = lengthRaw ? parseFloat(lengthRaw) : null;

		const [newRod] = await db.insert(rod).values({ userId: ownerId(locals), brand, model, lengthM, castingWeight, type, notes }).returning();
		redirect(303, `/tackle/rods/${newRod.id}`);
	}
};
