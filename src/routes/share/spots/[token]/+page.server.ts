import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '#lib/server/db/index.js';
import { spot, spotPhoto } from '#lib/server/db/schema.js';
import { eq, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const found = await db.query.spot.findFirst({
		where: (s, { eq }) => eq(s.shareToken, params.token),
		with: {
			tags: true,
			photos: { orderBy: [asc(spotPhoto.sortOrder)] }
		}
	});
	if (!found) error(404, 'Share link not found');
	return { spot: found };
};
