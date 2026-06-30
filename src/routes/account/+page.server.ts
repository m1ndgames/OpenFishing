import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { and, eq, ne, or } from 'drizzle-orm';
import { hashPassword, verifyPassword, generateApiToken, SESSION_COOKIE_NAME } from '$lib/server/auth';
import { getUsedBytes } from '$lib/server/uploads';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) redirect(303, '/');
	const me = await db.query.user.findFirst({ where: eq(user.id, locals.user.id) });
	if (!me) redirect(303, '/');
	return {
		account: {
			email: me.email,
			username: me.username,
			isAdmin: me.isAdmin,
			apiToken: me.apiToken,
			quotaBytes: me.quotaBytes,
			usedBytes: await getUsedBytes(me.id)
		}
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) redirect(303, '/');
		if (locals.user.isAdmin) return fail(403, { error: 'adminEnvControlled' });

		const data = await request.formData();
		const email = ((data.get('email') as string) ?? '').trim().toLowerCase();
		const username = ((data.get('username') as string) ?? '').trim();
		if (!email || !username) return fail(400, { error: 'userFieldsRequired' });
		if (!email.includes('@')) return fail(400, { error: 'invalidEmail' });

		const clash = await db.query.user.findFirst({
			where: and(ne(user.id, locals.user.id), or(eq(user.email, email), eq(user.username, username)))
		});
		if (clash) return fail(409, { error: 'userExists' });

		await db.update(user).set({ email, username, updatedAt: new Date() }).where(eq(user.id, locals.user.id));
		return { success: 'profileUpdated' };
	},

	changePassword: async ({ request, locals, cookies }) => {
		if (!locals.user) redirect(303, '/');
		if (locals.user.isAdmin) return fail(403, { error: 'adminEnvControlled' });

		const data = await request.formData();
		const current = (data.get('current_password') as string) ?? '';
		const next = (data.get('new_password') as string) ?? '';
		if (!next) return fail(400, { error: 'passwordRequired' });

		const me = await db.query.user.findFirst({ where: eq(user.id, locals.user.id) });
		if (!me || !(await verifyPassword(current, me.passwordHash))) {
			return fail(401, { error: 'wrongPassword' });
		}

		await db.update(user).set({ passwordHash: await hashPassword(next), updatedAt: new Date() }).where(eq(user.id, locals.user.id));
		// Changing the password invalidates the current session cookie — force re-login.
		cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		redirect(303, '/login');
	},

	regenerateToken: async ({ locals }) => {
		if (!locals.user) redirect(303, '/');
		await db.update(user).set({ apiToken: generateApiToken(), updatedAt: new Date() }).where(eq(user.id, locals.user.id));
		return { success: 'tokenRegenerated' };
	}
};
