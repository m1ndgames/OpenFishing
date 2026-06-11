import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishCatch, catchPhoto, lure, combo } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';
import { saveUpload, deleteUpload } from '$lib/server/uploads';

export const load: PageServerLoad = async ({ params }) => {
	const [found, lures, combos] = await Promise.all([
		db.query.fishCatch.findFirst({
			where: eq(fishCatch.id, params.id),
			with: {
				photos: { orderBy: [asc(catchPhoto.sortOrder)] },
				lure: true,
				combo: true
			}
		}),
		db.select({ id: lure.id, lureNumber: lure.lureNumber, name: lure.name }).from(lure).orderBy(asc(lure.lureNumber)),
		db.query.combo.findMany({ orderBy: [asc(combo.name)], with: { rod: true, reel: true } })
	]);
	if (!found) error(404, 'Catch not found');
	return { catch: found, lures, combos };
};

export const actions: Actions = {
	update: async ({ request, params }) => {
		const data = await request.formData();

		const caughtAtRaw = (data.get('caught_at') as string)?.trim();
		const species = (data.get('species') as string)?.trim() || null;
		const weightRaw = (data.get('weight_g') as string)?.trim();
		const lengthRaw = (data.get('length_cm') as string)?.trim();
		const latRaw = (data.get('lat') as string)?.trim();
		const lngRaw = (data.get('lng') as string)?.trim();
		const notes = (data.get('notes') as string)?.trim() || null;
		const lureId = (data.get('lure_id') as string)?.trim() || null;
		const comboId = (data.get('combo_id') as string)?.trim() || null;
		const catchAndRelease = data.get('catchAndRelease') === '1';
		const presentation = (data.get('presentation') as string)?.trim() || null;

		const caughtAt = caughtAtRaw ? new Date(caughtAtRaw) : new Date();
		const weightG = weightRaw ? parseFloat(weightRaw) : null;
		const lengthCm = lengthRaw ? parseFloat(lengthRaw) : null;
		const lat = latRaw ? parseFloat(latRaw) : null;
		const lng = lngRaw ? parseFloat(lngRaw) : null;

		if (!species) return fail(400, { error: 'speciesRequired' });
		if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return fail(400, { error: 'locationRequired' });

		const existing = await db.query.fishCatch.findFirst({
			where: eq(fishCatch.id, params.id),
			with: { photos: true }
		});
		if (!existing) error(404);

		const removeIds = data.getAll('remove_photo') as string[];
		for (const photoId of removeIds) {
			const ph = existing.photos.find((p) => p.id === photoId);
			if (ph) {
				await deleteUpload(ph.filename);
				await db.delete(catchPhoto).where(eq(catchPhoto.id, photoId));
			}
		}

		const photoFiles = data.getAll('new_photos') as File[];
		const validPhotos = photoFiles.filter((f) => f && f.size > 0);
		if (validPhotos.length > 0) {
			const remaining = await db.query.catchPhoto.findMany({
				where: eq(catchPhoto.catchId, params.id),
				orderBy: [asc(catchPhoto.sortOrder)]
			});
			const nextOrder = remaining.length > 0 ? Math.max(...remaining.map((p) => p.sortOrder)) + 1 : 0;
			const filenames = await Promise.all(validPhotos.map((f) => saveUpload(f)));
			await db.insert(catchPhoto).values(
				filenames.map((filename, i) => ({ catchId: params.id, filename, sortOrder: nextOrder + i }))
			);
		}

		await db
			.update(fishCatch)
			.set({ caughtAt, species, weightG, lengthCm, lat, lng, notes, lureId, comboId, catchAndRelease, presentation, updatedAt: new Date() })
			.where(eq(fishCatch.id, params.id));

		redirect(303, `/catches/${params.id}`);
	},

	delete: async ({ params }) => {
		const found = await db.query.fishCatch.findFirst({
			where: eq(fishCatch.id, params.id),
			with: { photos: true }
		});
		if (found) {
			for (const ph of found.photos) await deleteUpload(ph.filename);
			await db.delete(fishCatch).where(eq(fishCatch.id, params.id));
		}
		redirect(303, '/catches');
	}
};
