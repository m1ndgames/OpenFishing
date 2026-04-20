import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { lure } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
	const unlabeled = await db.query.lure.findMany({
		where: eq(lure.qrCoded, false),
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
			return { id: l.id, lureNumber: l.lureNumber, name: l.name, brand: l.brand, qrSvg };
		})
	);

	return { items };
};

export const actions: Actions = {
	markLabeled: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (id) {
			await db.update(lure).set({ qrCoded: true }).where(eq(lure.id, id));
		}
		return { success: true };
	}
};
