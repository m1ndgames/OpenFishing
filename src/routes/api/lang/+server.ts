import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SUPPORTED_LANGS, type Lang } from '$lib/i18n';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const data = await request.formData();
	const lang = data.get('lang') as string;
	const redirectTo = (data.get('redirect') as string) || '/';

	if (SUPPORTED_LANGS.includes(lang as Lang)) {
		cookies.set('lang', lang, {
			path: '/',
			maxAge: 60 * 60 * 24 * 365,
			sameSite: 'lax'
		});
	}

	redirect(303, redirectTo);
};
