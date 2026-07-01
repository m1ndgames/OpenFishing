import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { spot, spotTag, spotPhoto } from '$lib/server/db/schema';
import { eq, asc, and } from 'drizzle-orm';
import { saveUpload, deleteUpload, QuotaExceededError } from '$lib/server/uploads';
import { userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ params, locals }) => {
	const found = await db.query.spot.findFirst({
		where: and(eq(spot.id, params.id), userFilter(locals, spot.userId)),
		with: {
			tags: true,
			photos: { orderBy: [asc(spotPhoto.sortOrder)] }
		}
	});
	if (!found) error(404, 'Spot not found');
	return { spot: found };
};

export const actions: Actions = {
	update: async ({ request, params, locals }) => {
		const data = await request.formData();

		const name = (data.get('name') as string)?.trim() || 'Untitled Spot';
		const latRaw = (data.get('lat') as string)?.trim();
		const lngRaw = (data.get('lng') as string)?.trim();
		const notes = (data.get('notes') as string)?.trim() || null;
		const tagsRaw = (data.get('tags') as string)?.trim();

		if (!latRaw || !lngRaw) return fail(400, { error: 'locationRequired' });
		const lat = parseFloat(latRaw);
		const lng = parseFloat(lngRaw);
		if (isNaN(lat) || isNaN(lng)) return fail(400, { error: 'locationRequired' });

		const existing = await db.query.spot.findFirst({
			where: and(eq(spot.id, params.id), userFilter(locals, spot.userId)),
			with: { photos: true }
		});
		if (!existing) error(404);

		// Handle photo deletions
		const removeIds = data.getAll('remove_photo') as string[];
		for (const photoId of removeIds) {
			const ph = existing.photos.find((p) => p.id === photoId);
			if (ph) {
				await deleteUpload(ph.filename);
				await db.delete(spotPhoto).where(eq(spotPhoto.id, photoId));
			}
		}

		// Handle new photo uploads
		const photoFiles = data.getAll('new_photos') as File[];
		const validPhotos = photoFiles.filter((f) => f && f.size > 0);
		if (validPhotos.length > 0) {
			const remaining = await db.query.spotPhoto.findMany({
				where: eq(spotPhoto.spotId, params.id),
				orderBy: [asc(spotPhoto.sortOrder)]
			});
			const nextOrder = remaining.length > 0 ? Math.max(...remaining.map((p) => p.sortOrder)) + 1 : 0;
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
			await db.insert(spotPhoto).values(
				filenames.map((filename, i) => ({ spotId: params.id, filename, sortOrder: nextOrder + i }))
			);
		}

		await db
			.update(spot)
			.set({ name, lat, lng, notes, updatedAt: new Date() })
			.where(and(eq(spot.id, params.id), userFilter(locals, spot.userId)));

		await db.delete(spotTag).where(eq(spotTag.spotId, params.id));
		if (tagsRaw) {
			const tagNames = tagsRaw.split(/\s+/).filter(Boolean);
			if (tagNames.length > 0) {
				await db.insert(spotTag).values(tagNames.map((n) => ({ spotId: params.id, name: n })));
			}
		}

		redirect(303, `/spots/${params.id}`);
	},

	delete: async ({ params, locals }) => {
		const found = await db.query.spot.findFirst({
			where: and(eq(spot.id, params.id), userFilter(locals, spot.userId)),
			with: { photos: true }
		});
		if (found) {
			for (const ph of found.photos) await deleteUpload(ph.filename);
			await db.delete(spot).where(and(eq(spot.id, params.id), userFilter(locals, spot.userId)));
		}
		redirect(303, '/spots');
	}
};
