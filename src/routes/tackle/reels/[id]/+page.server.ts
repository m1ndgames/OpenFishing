import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { reel, reelLineLog, fishingLine, combo } from '$lib/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ params, locals }) => {
	const found = await db.select().from(reel).where(and(eq(reel.id, params.id), userFilter(locals, reel.userId))).limit(1);
	if (!found[0]) error(404, 'Reel not found');

	const [lineLogs, lines, combos] = await Promise.all([
		db.query.reelLineLog.findMany({
			where: eq(reelLineLog.reelId, params.id),
			orderBy: [desc(reelLineLog.spooledAt)],
			with: { line: true }
		}),
		db.select().from(fishingLine).where(userFilter(locals, fishingLine.userId)).orderBy(fishingLine.model),
		db.query.combo.findMany({
			where: and(eq(combo.reelId, params.id), userFilter(locals, combo.userId)),
			with: { rod: true }
		})
	]);

	return { reel: found[0], lineLogs, lines, combos };
};

async function ownsReel(locals: App.Locals, reelId: string): Promise<boolean> {
	const found = await db.select({ id: reel.id }).from(reel).where(and(eq(reel.id, reelId), userFilter(locals, reel.userId))).limit(1);
	return !!found[0];
}

export const actions: Actions = {
	addLine: async ({ request, params, locals }) => {
		const data = await request.formData();
		const lineId = (data.get('line_id') as string)?.trim() || null;
		const spooledAtRaw = (data.get('spooled_at') as string)?.trim();
		const notes = (data.get('notes') as string)?.trim() || null;

		if (!spooledAtRaw) return fail(400, { error: 'reelSpooledAtRequired' });
		if (!(await ownsReel(locals, params.id))) error(404);

		const spooledAt = new Date(spooledAtRaw);
		await db.insert(reelLineLog).values({ reelId: params.id, lineId, spooledAt, notes });
		redirect(303, `/tackle/reels/${params.id}`);
	},

	deleteLine: async ({ request, params, locals }) => {
		const data = await request.formData();
		const logId = (data.get('log_id') as string)?.trim();
		if (logId && (await ownsReel(locals, params.id))) await db.delete(reelLineLog).where(eq(reelLineLog.id, logId));
		redirect(303, `/tackle/reels/${params.id}`);
	}
};
