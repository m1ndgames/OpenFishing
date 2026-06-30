import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { lure } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { env } from '$env/dynamic/private';
import { userFilter } from '$lib/server/scope';

export const load: PageServerLoad = async ({ locals }) => {
	const unlabeled = await db.query.lure.findMany({
		where: and(eq(lure.qrCoded, false), userFilter(locals, lure.userId)),
		orderBy: (lure, { asc }) => [asc(lure.lureNumber)]
	});

	const baseUrl = env.BASE_URL ?? 'http://localhost:5173';

	const items = await Promise.all(
		unlabeled.map(async (l) => {
			const qrSvg = await QRCode.toString(`${baseUrl}/lures/${l.id}`, {
				type: 'svg',
				width: 64,
				margin: 1,
				color: { dark: '#000000', light: '#ffffff' }
			});
			return { id: l.id, lureNumber: l.lureNumber, name: l.name, brand: l.brand, color: l.color, qrSvg };
		})
	);

	return { items };
};

export const actions: Actions = {
	markLabeled: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (id) {
			await db.update(lure).set({ qrCoded: true }).where(and(eq(lure.id, id), userFilter(locals, lure.userId)));
		}
		return { success: true };
	}
};
