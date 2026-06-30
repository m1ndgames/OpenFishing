import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { appSetting, userSetting } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { THEME_IDS } from '$lib/themes';

export const load: PageServerLoad = async ({ locals }) => {
	let map: Record<string, string>;
	if (locals?.user) {
		const rows = await db.select().from(userSetting).where(eq(userSetting.userId, locals.user.id));
		map = Object.fromEntries(rows.map(s => [s.key, s.value]));
	} else {
		const rows = await db.select().from(appSetting);
		map = Object.fromEntries(rows.map(s => [s.key, s.value]));
	}
	return {
		colorMode: (map.colorMode ?? 'dark') as 'dark' | 'light' | 'system',
		themeName: map.themeName ?? 'ocean',
	};
};

async function saveSetting(locals: App.Locals, key: string, value: string) {
	if (locals?.user) {
		await db
			.insert(userSetting)
			.values({ userId: locals.user.id, key, value })
			.onConflictDoUpdate({ target: [userSetting.userId, userSetting.key], set: { value } });
	} else {
		await db
			.insert(appSetting)
			.values({ key, value })
			.onConflictDoUpdate({ target: appSetting.key, set: { value } });
	}
}

export const actions: Actions = {
	setMode: async ({ request, cookies, locals }) => {
		const form = await request.formData();
		const mode = form.get('colorMode') as string;
		if (!['dark', 'light', 'system'].includes(mode)) return;

		await saveSetting(locals, 'colorMode', mode);

		cookies.set('of_colormode', mode, { path: '/', maxAge: 60 * 60 * 24 * 365, httpOnly: false, sameSite: 'lax' });
	},

	setTheme: async ({ request, locals }) => {
		const form = await request.formData();
		const theme = form.get('themeName') as string;
		if (!THEME_IDS.includes(theme)) return;

		await saveSetting(locals, 'themeName', theme);
	},
};
