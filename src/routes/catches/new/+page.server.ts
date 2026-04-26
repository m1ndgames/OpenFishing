import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishCatch, catchPhoto, lure } from '$lib/server/db/schema';
import { saveUpload } from '$lib/server/uploads';
import { asc } from 'drizzle-orm';
import { fetchWeather } from '$lib/server/biteIndex';

export const load: PageServerLoad = async () => {
	const lures = await db
		.select({ id: lure.id, lureNumber: lure.lureNumber, name: lure.name })
		.from(lure)
		.orderBy(asc(lure.lureNumber));
	return { lures };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const caughtAtRaw = (data.get('caught_at') as string)?.trim();
		const species = (data.get('species') as string)?.trim() || null;
		const weightRaw = (data.get('weight_g') as string)?.trim();
		const lengthRaw = (data.get('length_cm') as string)?.trim();
		const latRaw = (data.get('lat') as string)?.trim();
		const lngRaw = (data.get('lng') as string)?.trim();
		const notes = (data.get('notes') as string)?.trim() || null;
		const lureId = (data.get('lure_id') as string)?.trim() || null;
		const catchAndRelease = data.get('catchAndRelease') === '1';
		const presentation = (data.get('presentation') as string)?.trim() || null;

		const caughtAt = caughtAtRaw ? new Date(caughtAtRaw) : new Date();
		const weightG = weightRaw ? parseFloat(weightRaw) : null;
		const lengthCm = lengthRaw ? parseFloat(lengthRaw) : null;
		const lat = latRaw ? parseFloat(latRaw) : null;
		const lng = lngRaw ? parseFloat(lngRaw) : null;

		if (!species) return fail(400, { error: 'speciesRequired' });
		if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return fail(400, { error: 'locationRequired' });

		const weather = await fetchWeather(lat, lng);
		const biteIndex = weather?.biteIndex ?? null;

		const [newCatch] = await db
			.insert(fishCatch)
			.values({ caughtAt, species, weightG, lengthCm, lat, lng, notes, lureId, catchAndRelease, presentation, biteIndex })
			.returning();

		const photoFiles = data.getAll('photos') as File[];
		const validPhotos = photoFiles.filter((f) => f && f.size > 0);
		if (validPhotos.length > 0) {
			const filenames = await Promise.all(validPhotos.map((f) => saveUpload(f)));
			await db.insert(catchPhoto).values(
				filenames.map((filename, i) => ({ catchId: newCatch.id, filename, sortOrder: i }))
			);
		}

		redirect(303, `/catches/${newCatch.id}`);
	}
};
