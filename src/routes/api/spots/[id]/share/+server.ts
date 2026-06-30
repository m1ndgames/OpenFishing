import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { spot } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { userFilter } from '$lib/server/scope';

export const POST = async ({ params, locals }) => {
	const token = crypto.randomUUID();
	const rows = await db.update(spot)
		.set({ shareToken: token })
		.where(and(eq(spot.id, params.id), userFilter(locals, spot.userId)))
		.returning({ id: spot.id });
	if (!rows.length) error(404);
	const baseUrl = env.BASE_URL ?? 'http://localhost:5173';
	return json({ shareToken: token, shareUrl: `${baseUrl}/share/spots/${token}` });
};

export const DELETE = async ({ params, locals }) => {
	const rows = await db.update(spot)
		.set({ shareToken: null })
		.where(and(eq(spot.id, params.id), userFilter(locals, spot.userId)))
		.returning({ id: spot.id });
	if (!rows.length) error(404);
	return json({ ok: true });
};
