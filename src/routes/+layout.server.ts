import type { LayoutServerLoad } from './$types';
import { translations, defaultLang, SUPPORTED_LANGS, type Lang } from '$lib/i18n';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { appSetting, userSetting } from '$lib/server/db/schema';
import { and, eq, inArray } from 'drizzle-orm';
import { authEnabled } from '$lib/server/auth';

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

	// Appearance: the global `appSetting` holds the instance default (admin-configurable, and
	// what the login screen uses). A logged-in user's own `userSetting` overrides it per key.
	const globalRows = await db.select().from(appSetting).where(inArray(appSetting.key, ['colorMode', 'themeName']));
	const globalMap = Object.fromEntries(globalRows.map((s) => [s.key, s.value]));

	let userMap: Record<string, string> = {};
	if (locals?.user) {
		const rows = await db
			.select({ key: userSetting.key, value: userSetting.value })
			.from(userSetting)
			.where(and(eq(userSetting.userId, locals.user.id), inArray(userSetting.key, ['colorMode', 'themeName'])));
		userMap = Object.fromEntries(rows.map((s) => [s.key, s.value]));
	}

	const colorMode = (userMap.colorMode ?? globalMap.colorMode ?? 'dark') as 'dark' | 'light' | 'system';
	const themeName = userMap.themeName ?? globalMap.themeName ?? 'ocean';

	const chatbotEnabled = !!env.CHATBOT && (locals?.user?.chatbotEnabled ?? true);

	return {
		t: translations[lang],
		lang,
		demoMode: !!env.DEMO_MODE,
		chatbotEnabled,
		colorMode,
		themeName,
		authEnabled: authEnabled(),
		user: locals?.user ? { username: locals.user.username, email: locals.user.email, isAdmin: locals.user.isAdmin } : null
	};
};
