import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { eq, asc, and } from 'drizzle-orm';
import { chatMessage as chatMessageTable } from '$lib/server/db/schema';
import { userFilter } from '$lib/server/scope';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!env.CHATBOT) error(503, 'Chatbot not configured');

	const messages = await db
		.select({ role: chatMessageTable.role, content: chatMessageTable.content })
		.from(chatMessageTable)
		.where(and(eq(chatMessageTable.sessionId, params.sessionId), userFilter(locals, chatMessageTable.userId)))
		.orderBy(asc(chatMessageTable.id));

	return json({ messages });
};

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!env.CHATBOT) error(503, 'Chatbot not configured');

	await db.delete(chatMessageTable).where(and(eq(chatMessageTable.sessionId, params.sessionId), userFilter(locals, chatMessageTable.userId)));

	return json({ ok: true });
};
