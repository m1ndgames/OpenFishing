import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { reel } from '$lib/server/db/schema';
import { ownerId } from '$lib/server/scope';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const brand = (data.get('brand') as string)?.trim() || null;
		const model = (data.get('model') as string)?.trim();
		const size = (data.get('size') as string)?.trim() || null;
		const notes = (data.get('notes') as string)?.trim() || null;

		if (!model) return fail(400, { error: 'reelModelRequired' });

		const [newReel] = await db.insert(reel).values({ userId: ownerId(locals), brand, model, size, notes }).returning();
		redirect(303, `/tackle/reels/${newReel.id}`);
	}
};
