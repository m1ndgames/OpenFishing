import type { LayoutServerLoad } from './$types';
import { translations, defaultLang, SUPPORTED_LANGS, type Lang } from '$lib/i18n';
import { env } from '$env/dynamic/private';

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

	return { t: translations[lang], lang, demoMode: !!env.DEMO_MODE };
};
