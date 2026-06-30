import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishCatch, catchPhoto, lure, combo } from '$lib/server/db/schema';
import { saveUpload, deleteUpload, QuotaExceededError } from '$lib/server/uploads';
import { asc } from 'drizzle-orm';
import { fetchWeather } from '$lib/server/biteIndex';
import { ownerId, userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ locals }) => {
	const [lures, combos] = await Promise.all([
		db.select({ id: lure.id, lureNumber: lure.lureNumber, name: lure.name }).from(lure).where(userFilter(locals, lure.userId)).orderBy(asc(lure.lureNumber)),
		db.query.combo.findMany({ where: userFilter(locals, combo.userId), orderBy: [asc(combo.name)], with: { rod: true, reel: true } })
	]);
	return { lures, combos };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
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

		const weather = await fetchWeather(lat, lng);
		const biteIndex = weather?.biteIndex ?? null;

		// Save photos first so a quota failure never leaves an orphaned catch.
		const photoFiles = data.getAll('photos') as File[];
		const validPhotos = photoFiles.filter((f) => f && f.size > 0);
		const filenames: string[] = [];
		try {
			for (const f of validPhotos) filenames.push(await saveUpload(f, locals?.user));
		} catch (e) {
			if (e instanceof QuotaExceededError) {
				await Promise.all(filenames.map((fn) => deleteUpload(fn)));
				return fail(413, { error: 'quotaExceeded' });
			}
			throw e;
		}

		const [newCatch] = await db
			.insert(fishCatch)
			.values({ userId: ownerId(locals), caughtAt, species, weightG, lengthCm, lat, lng, notes, lureId, comboId, catchAndRelease, presentation, biteIndex })
			.returning();

		if (filenames.length > 0) {
			await db.insert(catchPhoto).values(
				filenames.map((filename, i) => ({ catchId: newCatch.id, filename, sortOrder: i }))
			);
		}

		redirect(303, `/catches/${newCatch.id}`);
	}
};
