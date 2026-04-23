import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { fishCatch } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const POST = async ({ params }) => {
	const token = crypto.randomUUID();
	const rows = await db.update(fishCatch)
		.set({ shareToken: token })
		.where(eq(fishCatch.id, params.id))
		.returning({ id: fishCatch.id });
	if (!rows.length) error(404);
	const baseUrl = env.BASE_URL ?? 'http://localhost:5173';
	return json({ shareToken: token, shareUrl: `${baseUrl}/share/catches/${token}` });
};

export const DELETE = async ({ params }) => {
	const rows = await db.update(fishCatch)
		.set({ shareToken: null })
		.where(eq(fishCatch.id, params.id))
		.returning({ id: fishCatch.id });
	if (!rows.length) error(404);
	return json({ ok: true });
};
