import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { lure, tag } from '$lib/server/db/schema';
import { isNotNull, max } from 'drizzle-orm';
import { saveUpload } from '$lib/server/uploads';

export const load: PageServerLoad = async () => {
	const distinct = async <T>(col: Parameters<typeof db.selectDistinct>[0]) => {
		const rows = await db.selectDistinct(col).from(lure).where(isNotNull(Object.values(col)[0]));
		return rows.map((r) => Object.values(r)[0] as T).filter(Boolean);
	};

	const [names, brands, types, colors, lightConditions] = await Promise.all([
		distinct<string>({ val: lure.name }),
		distinct<string>({ val: lure.brand }),
		distinct<string>({ val: lure.type }),
		distinct<string>({ val: lure.color }),
		distinct<string>({ val: lure.lightConditions })
	]);

	return { suggestions: { names, brands, types, colors, lightConditions } };
};

export const actions: Actions = {
	default: async ({ request }) => {
		const data = await request.formData();

		const name = (data.get('name') as string)?.trim() || 'Untitled';

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
		const lightConditions = (data.get('light_conditions') as string)?.trim() || null;

		const photoFile = data.get('photo') as File;
		if (!photoFile || photoFile.size === 0) return fail(400, { error: 'photoRequired' });
		const photoPath = await saveUpload(photoFile);

		const [{ maxNum }] = await db.select({ maxNum: max(lure.lureNumber) }).from(lure);
		const lureNumber = (maxNum ?? 0) + 1;

		const [newLure] = await db
			.insert(lure)
			.values({ name, brand, type, color, weight, size, notes, photoPath, species, runningDepth, waterType, lightConditions, lureNumber })
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
