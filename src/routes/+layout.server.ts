import type { LayoutServerLoad } from './$types';
import { translations, defaultLang, SUPPORTED_LANGS, type Lang } from '$lib/i18n';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { appSetting } from '$lib/server/db/schema';
import { inArray } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ cookies, request }) => {
	const cookie = cookies.get('lang') ?? '';

	let lang: Lang;
	if (SUPPORTED_LANGS.includes(cookie as Lang)) {
		lang = cookie as Lang;
	} else {
		const acceptLanguage = request.headers.get('accept-language') ?? '';
		const browserLang = acceptLanguage.split(',')[0].split('-')[0].toLowerCase();
		lang = SUPPORTED_LANGS.includes(browserLang as Lang) ? (browserLang as Lang) : defaultLang;
	}

	const settings = await db.select().from(appSetting).where(
		inArray(appSetting.key, ['colorMode', 'themeName'])
	);
	const settingMap = Object.fromEntries(settings.map(s => [s.key, s.value]));
	const colorMode = (settingMap.colorMode ?? 'dark') as 'dark' | 'light' | 'system';
	const themeName = settingMap.themeName ?? 'ocean';

	return { t: translations[lang], lang, demoMode: !!env.DEMO_MODE, chatbotEnabled: !!env.CHATBOT, colorMode, themeName };
};
