import type { LayoutServerLoad } from './$types';
import { translations, defaultLang, SUPPORTED_LANGS, type Lang } from '$lib/i18n';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { appSetting, userSetting } from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ cookies, request, locals }) => {
	const cookie = cookies.get('lang') ?? '';

	let lang: Lang;
	if (SUPPORTED_LANGS.includes(cookie as Lang)) {
		lang = cookie as Lang;
	} else {
		const acceptLanguage = request.headers.get('accept-language') ?? '';
		const browserLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
		lang = SUPPORTED_LANGS.includes(browserLang as Lang) ? (browserLang as Lang) : defaultLang;
	}

	// Appearance settings: per-user when logged in, global app setting otherwise.
	let settingMap: Record<string, string>;
	if (locals?.user) {
		const rows = await db
			.select({ key: userSetting.key, value: userSetting.value })
			.from(userSetting)
			.where(and(eq(userSetting.userId, locals.user.id), inArray(userSetting.key, ['colorMode', 'themeName'])));
		settingMap = Object.fromEntries(rows.map((s) => [s.key, s.value]));
	} else {
		const rows = await db.select().from(appSetting).where(inArray(appSetting.key, ['colorMode', 'themeName']));
		settingMap = Object.fromEntries(rows.map((s) => [s.key, s.value]));
	}
	const colorMode = (settingMap.colorMode ?? 'dark') as 'dark' | 'light' | 'system';
	const themeName = settingMap.themeName ?? 'ocean';

	const chatbotEnabled = !!env.CHATBOT && (locals?.user?.chatbotEnabled ?? true);

	return {
		t: translations[lang],
		lang,
		demoMode: !!env.DEMO_MODE,
		chatbotEnabled,
		colorMode,
		themeName,
		authEnabled: !!env.AUTH_PASSWORD,
		user: locals?.user ? { username: locals.user.username, email: locals.user.email, isAdmin: locals.user.isAdmin } : null
	};
};
