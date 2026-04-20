import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { lure, tag } from '$lib/server/db/schema';
import { eq, isNotNull } from 'drizzle-orm';
import { saveUpload, deleteUpload } from '$lib/server/uploads';

export const load: PageServerLoad = async ({ params }) => {
	const existing = await db.query.lure.findFirst({
		where: (lure, { eq }) => eq(lure.id, params.id),
		with: { tags: true }
	});

	if (!existing) error(404, 'Lure not found');

	const distinct = async <T>(col: Parameters<typeof db.selectDistinct>[0]) => {
		const rows = await db.selectDistinct(col).from(lure).where(isNotNull(Object.values(col)[0]));
		return rows.map((r) => Object.values(r)[0] as T).filter(Boolean);
	};

	const [names, brands, types, colors, weathers] = await Promise.all([
		distinct<string>({ val: lure.name }),
		distinct<string>({ val: lure.brand }),
		distinct<string>({ val: lure.type }),
		distinct<string>({ val: lure.color }),
		distinct<string>({ val: lure.weather })
	]);

	return { lure: existing, suggestions: { names, brands, types, colors, weathers } };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();

		const name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'nameRequired' });

		const brand = (data.get('brand') as string)?.trim() || null;
		const type = (data.get('type') as string)?.trim() || null;
		const color = (data.get('color') as string)?.trim() || null;
		const weightRaw = (data.get('weight') as string)?.trim();
		const weight = weightRaw ? parseFloat(weightRaw) : null;
		const size = (data.get('size') as string)?.trim() || null;
		const notes = (data.get('notes') as string)?.trim() || null;
		const tagsRaw = (data.get('tags') as string)?.trim();
		const species = (data.get('species') as string)?.trim() || null;
		const runningDepth = (data.get('running_depth') as string)?.trim() || null;
		const waterType = (data.get('water_type') as string)?.trim() || null;
		const weather = (data.get('weather') as string)?.trim() || null;
		const qrCoded = data.getAll('qr_coded').includes('1');

		const photoFile = data.get('photo') as File;
		const clearPhoto = data.get('clear_photo') === '1';

		const existing = await db.query.lure.findFirst({
			where: (l, { eq }) => eq(l.id, params.id)
		});
		if (!existing) error(404);

		let photoPath = existing.photoPath;
		if (clearPhoto) {
			if (existing.photoPath) await deleteUpload(existing.photoPath);
			photoPath = null;
		} else if (photoFile && photoFile.size > 0) {
			if (existing.photoPath) await deleteUpload(existing.photoPath);
			photoPath = await saveUpload(photoFile);
		}

		await db
			.update(lure)
			.set({ name, brand, type, color, weight, size, notes, photoPath, species, runningDepth, waterType, weather, qrCoded, updatedAt: new Date() })
			.where(eq(lure.id, params.id));

		await db.delete(tag).where(eq(tag.lureId, params.id));
		if (tagsRaw) {
			const tagNames = tagsRaw.split(/\s+/).filter(Boolean);
			if (tagNames.length > 0) {
				await db.insert(tag).values(tagNames.map((n) => ({ lureId: params.id, name: n })));
			}
		}

		redirect(303, `/lures/${params.id}`);
	},

	delete: async ({ params }) => {
		const existing = await db.query.lure.findFirst({
			where: (l, { eq }) => eq(l.id, params.id)
		});
		if (existing?.photoPath) await deleteUpload(existing.photoPath);
		await db.delete(lure).where(eq(lure.id, params.id));
		redirect(303, '/');
	}
};
