import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishCatch, catchPhoto, lure as lureTable } from '$lib/server/db/schema';
import { eq, desc, asc, and } from 'drizzle-orm';
import QRCode from 'qrcode';
import { env } from '$env/dynamic/private';
import { userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ params, locals }) => {
	const [lure, lureCatches] = await Promise.all([
		db.query.lure.findFirst({
			where: and(eq(lureTable.id, params.id), userFilter(locals, lureTable.userId)),
			with: { tags: true }
		}),
		db.query.fishCatch.findMany({
			where: and(eq(fishCatch.lureId, params.id), userFilter(locals, fishCatch.userId)),
			orderBy: [desc(fishCatch.caughtAt)],
			with: { photos: { orderBy: [asc(catchPhoto.sortOrder)], limit: 1 } }
		})
	]);

	if (!lure) error(404, 'Lure not found');

	const baseUrl = env.BASE_URL ?? 'http://localhost:5173';
	const qrSvg = await QRCode.toString(`${baseUrl}/lures/${lure.id}`, {
		type: 'svg',
		margin: 1,
		color: { dark: '#1e293b', light: '#ffffff' }
	});

	const authEnabled = !!env.AUTH_PASSWORD;
	const shareUrl = lure.shareToken ? `${baseUrl}/share/lures/${lure.shareToken}` : null;

	return { lure, qrSvg, lureCatches, authEnabled, shareUrl };
};
