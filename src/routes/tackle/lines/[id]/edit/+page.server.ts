import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishingLine } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const found = await db.select().from(fishingLine).where(eq(fishingLine.id, params.id)).limit(1);
	if (!found[0]) error(404, 'Line not found');
	return { line: found[0] };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
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

		await db.update(fishingLine).set({ brand, model, type, diameterMm, strengthKg, notes, updatedAt: new Date() }).where(eq(fishingLine.id, params.id));
		redirect(303, `/tackle/lines/${params.id}`);
	},

	delete: async ({ params }) => {
		await db.delete(fishingLine).where(eq(fishingLine.id, params.id));
		redirect(303, '/tackle');
	}
};
