import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { lure } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { userFilter } from '$lib/server/scope';

export const POST = async ({ params, locals }) => {
	const token = crypto.randomUUID();
	const rows = await db.update(lure)
		.set({ shareToken: token })
		.where(and(eq(lure.id, params.id), userFilter(locals, lure.userId)))
		.returning({ id: lure.id });
	if (!rows.length) error(404);
	const baseUrl = env.BASE_URL ?? 'http://localhost:5173';
	return json({ shareToken: token, shareUrl: `${baseUrl}/share/lures/${token}` });
};

export const DELETE = async ({ params, locals }) => {
	const rows = await db.update(lure)
		.set({ shareToken: null })
		.where(and(eq(lure.id, params.id), userFilter(locals, lure.userId)))
		.returning({ id: lure.id });
	if (!rows.length) error(404);
	return json({ ok: true });
};
