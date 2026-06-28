import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { appSetting } from '$lib/server/db/schema';
import { THEME_IDS } from '$lib/themes';

export const load: PageServerLoad = async () => {
	const settings = await db.select().from(appSetting);
	const map = Object.fromEntries(settings.map(s => [s.key, s.value]));
	return {
		colorMode: (map.colorMode ?? 'dark') as 'dark' | 'light' | 'system',
		themeName: map.themeName ?? 'ocean',
	};
};

export const actions: Actions = {
	setMode: async ({ request, cookies }) => {
		const form = await request.formData();
		const mode = form.get('colorMode') as string;
		if (!['dark', 'light', 'system'].includes(mode)) return;

		await db
			.insert(appSetting)
			.values({ key: 'colorMode', value: mode })
			.onConflictDoUpdate({ target: appSetting.key, set: { value: mode } });

		cookies.set('of_colormode', mode, { path: '/', maxAge: 60 * 60 * 24 * 365, httpOnly: false, sameSite: 'lax' });
	},

	setTheme: async ({ request }) => {
		const form = await request.formData();
		const theme = form.get('themeName') as string;
		if (!THEME_IDS.includes(theme)) return;

		await db
			.insert(appSetting)
			.values({ key: 'themeName', value: theme })
			.onConflictDoUpdate({ target: appSetting.key, set: { value: theme } });
	},
};
