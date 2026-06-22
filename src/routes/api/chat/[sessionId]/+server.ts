import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { eq, asc } from 'drizzle-orm';
import { chatMessage as chatMessageTable } from '$lib/server/db/schema';

export const GET: RequestHandler = async ({ params }) => {
	if (!env.CHATBOT) error(503, 'Chatbot not configured');

	const messages = await db
		.select({ role: chatMessageTable.role, content: chatMessageTable.content })
		.from(chatMessageTable)
		.where(eq(chatMessageTable.sessionId, params.sessionId))
		.orderBy(asc(chatMessageTable.id));

	return json({ messages });
};

export const DELETE: RequestHandler = async ({ params }) => {
	if (!env.CHATBOT) error(503, 'Chatbot not configured');

	await db.delete(chatMessageTable).where(eq(chatMessageTable.sessionId, params.sessionId));

	return json({ ok: true });
};
