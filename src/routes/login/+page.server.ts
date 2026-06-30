import { fail, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { Actions, PageServerLoad } from './$types';
import {
	SESSION_COOKIE_NAME,
	ensureAdminUser,
	findUserByIdentifier,
	resolveSessionUser,
	sessionCookieValue,
	verifyPassword
} from '$lib/server/auth';

export const load: PageServerLoad = async ({ cookies }) => {
	if (!env.AUTH_PASSWORD) redirect(303, '/');

	await ensureAdminUser();
	const current = await resolveSessionUser(cookies.get(SESSION_COOKIE_NAME));
	if (current) redirect(303, '/');

	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		if (!env.AUTH_PASSWORD) redirect(303, '/');
		await ensureAdminUser();

		const data = await request.formData();
		const identifier = (data.get('identifier') as string) ?? '';
		const submitted = (data.get('password') as string) ?? '';

		const account = await findUserByIdentifier(identifier);
		if (!account || account.disabled || !(await verifyPassword(submitted, account.passwordHash))) {
			return fail(401, { error: true });
		}

		cookies.set(SESSION_COOKIE_NAME, sessionCookieValue(account), {
			path: '/',
			httpOnly: true,
			sameSite: 'strict',
			secure: false,
			maxAge: 60 * 60 * 24 * 365
		});

		redirect(303, '/');
	}
};
