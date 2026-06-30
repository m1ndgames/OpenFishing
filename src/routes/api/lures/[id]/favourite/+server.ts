import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { lure } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { userFilter } from '$lib/server/scope';

export const POST: RequestHandler = async ({ params, locals }) => {
	const existing = await db.query.lure.findFirst({
		where: and(eq(lure.id, params.id), userFilter(locals, lure.userId))
	});
	if (!existing) error(404, 'Lure not found');

	const newVal = !existing.favourite;
	await db.update(lure).set({ favourite: newVal }).where(and(eq(lure.id, params.id), userFilter(locals, lure.userId)));

	return json({ favourite: newVal });
};
