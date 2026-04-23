import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { fishCatch, catchPhoto } from '$lib/server/db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import QRCode from 'qrcode';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params }) => {
	const [lure, lureCatches] = await Promise.all([
		db.query.lure.findFirst({
			where: (lure, { eq }) => eq(lure.id, params.id),
			with: { tags: true }
		}),
		db.query.fishCatch.findMany({
			where: eq(fishCatch.lureId, params.id),
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
