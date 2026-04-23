import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishCatch, catchPhoto } from '$lib/server/db/schema';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const found = await db.query.fishCatch.findFirst({
		where: (c, { eq }) => eq(c.shareToken, params.token),
		with: {
			photos: { orderBy: [asc(catchPhoto.sortOrder)] },
			lure: true
		}
	});
	if (!found) error(404, 'Share link not found');
	return { catch: found };
};
