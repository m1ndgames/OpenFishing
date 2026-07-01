import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { lure, tag } from '$lib/server/db/schema';
import { and, isNotNull, max } from 'drizzle-orm';
import { saveUpload, QuotaExceededError } from '$lib/server/uploads';
import { ownerId, userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ locals }) => {
	const distinct = async <T>(col: Parameters<typeof db.selectDistinct>[0]) => {
		const rows = await db.selectDistinct(col).from(lure).where(and(isNotNull(Object.values(col)[0] as Parameters<typeof isNotNull>[0]), userFilter(locals, lure.userId)));
		return rows.map((r) => Object.values(r)[0] as T).filter(Boolean);
	};

	const speciesRows = await db
		.select({ val: lure.species })
		.from(lure)
		.where(and(isNotNull(lure.species), userFilter(locals, lure.userId)));
	const species = [...new Set(speciesRows.flatMap((r) => (r.val as string).split(/\s+/).filter(Boolean)))].sort();

	const [names, brands, types, colors] = await Promise.all([
		distinct<string>({ val: lure.name }),
		distinct<string>({ val: lure.brand }),
		distinct<string>({ val: lure.type }),
		distinct<string>({ val: lure.color })
	]);

	return { suggestions: { names, brands, types, colors, species } };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();

		const name = (data.get('name') as string)?.trim() || 'Untitled';

		const brand = (data.get('brand') as string)?.trim() || null;
		const type = (data.get('type') as string)?.trim() || null;
		const color = (data.get('color') as string)?.trim() || null;
		const weightRaw = (data.get('weight') as string)?.trim();
		const weight = weightRaw ? Math.round(parseFloat(weightRaw) * 10) / 10 : null;
		const sizeRaw = (data.get('size') as string)?.trim();
		const sizeNum = sizeRaw ? parseFloat(sizeRaw) : NaN;
		const size = !isNaN(sizeNum) ? String(Math.round(sizeNum * 10) / 10) : (sizeRaw || null);
		const notes = (data.get('notes') as string)?.trim() || null;
		const tagsRaw = (data.get('tags') as string)?.trim();
		const species = (data.get('species') as string)?.trim() || null;
		const runningDepth = (data.get('running_depth') as string)?.trim() || null;
		const waterType = (data.get('water_type') as string)?.trim() || null;
		const lightRaw = (data.get('light_conditions') as string)?.trim();
		const lightConditions = lightRaw !== '' && lightRaw != null ? parseInt(lightRaw, 10) : null;
		const amountRaw = (data.get('amount') as string)?.trim();
		const amount = amountRaw ? Math.max(1, parseInt(amountRaw, 10)) : 1;

		const photoFile = data.get('photo') as File;
		if (!photoFile || photoFile.size === 0) return fail(400, { error: 'photoRequired' });
		let photoPath: string;
		try {
			photoPath = await saveUpload(photoFile, locals?.user);
		} catch (e) {
			if (e instanceof QuotaExceededError) return fail(413, { error: 'quotaExceeded' });
			throw e;
		}

		const [{ maxNum }] = await db
			.select({ maxNum: max(lure.lureNumber) })
			.from(lure)
			.where(userFilter(locals, lure.userId));
		const lureNumber = (maxNum ?? 0) + 1;

		const [newLure] = await db
			.insert(lure)
			.values({ userId: ownerId(locals), name, brand, type, color, weight, size, notes, photoPath, species, runningDepth, waterType, lightConditions, amount, lureNumber })
			.returning();

		if (tagsRaw) {
			const tagNames = tagsRaw.split(/\s+/).filter(Boolean);
			if (tagNames.length > 0) {
				await db.insert(tag).values(tagNames.map((name) => ({ lureId: newLure.id, name })));
			}
		}

		redirect(303, `/lures/${newLure.id}`);
	}
};
