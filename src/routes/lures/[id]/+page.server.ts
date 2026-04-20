import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import QRCode from 'qrcode';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async ({ params }) => {
	const lure = await db.query.lure.findFirst({
		where: (lure, { eq }) => eq(lure.id, params.id),
		with: { tags: true }
	});

	if (!lure) error(404, 'Lure not found');

	const baseUrl = env.BASE_URL ?? 'http://localhost:5173';
	const qrSvg = await QRCode.toString(`${baseUrl}/lures/${lure.id}`, {
		type: 'svg',
		margin: 1,
		color: { dark: '#1e293b', light: '#ffffff' }
	});

	return { lure, qrSvg };
};
