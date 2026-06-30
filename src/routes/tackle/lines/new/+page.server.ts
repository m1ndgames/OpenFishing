import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import { db } from '$lib/server/db';
import { fishingLine } from '$lib/server/db/schema';
import { ownerId } from '$lib/server/scope';

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const brand = (data.get('brand') as string)?.trim() || null;
		const model = (data.get('model') as string)?.trim();
		const type = (data.get('type') as string)?.trim() || null;
		const diameterRaw = (data.get('diameter_mm') as string)?.trim();
		const strengthRaw = (data.get('strength_kg') as string)?.trim();
		const notes = (data.get('notes') as string)?.trim() || null;

		if (!model) return fail(400, { error: 'lineModelRequired' });

		const diameterMm = diameterRaw ? parseFloat(diameterRaw) : null;
		const strengthKg = strengthRaw ? parseFloat(strengthRaw) : null;

		const [newLine] = await db.insert(fishingLine).values({ userId: ownerId(locals), brand, model, type, diameterMm, strengthKg, notes }).returning();
		redirect(303, `/tackle/lines/${newLine.id}`);
	}
};
