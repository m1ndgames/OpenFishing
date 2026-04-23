import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { lure } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	const found = await db.query.lure.findFirst({
		where: (l, { eq }) => eq(l.shareToken, params.token),
		with: { tags: true }
	});
	if (!found) error(404, 'Share link not found');
	return { lure: found };
};
