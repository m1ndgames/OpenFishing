import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { and, eq, gt } from 'drizzle-orm';
import { authEnabled, hashPassword, hashResetToken } from '$lib/server/auth';

async function userForToken(token: string) {
	if (!token) return undefined;
	return db.query.user.findFirst({
		where: and(eq(user.resetTokenHash, hashResetToken(token)), gt(user.resetTokenExpiry, new Date()))
	});
}

export const load: PageServerLoad = async ({ url }) => {
	if (!authEnabled()) redirect(303, '/login');
	const token = url.searchParams.get('token') ?? '';
	const account = await userForToken(token);
	return { valid: !!account, token };
};

export const actions: Actions = {
	default: async ({ request }) => {
		if (!authEnabled()) redirect(303, '/login');
		const data = await request.formData();
		const token = (data.get('token') as string) ?? '';
		const password = (data.get('password') as string) ?? '';
		if (!password) return fail(400, { error: 'passwordRequired' });

		const account = await userForToken(token);
		if (!account) return fail(400, { error: 'resetTokenInvalid' });

		await db
			.update(user)
			.set({ passwordHash: await hashPassword(password), resetTokenHash: null, resetTokenExpiry: null, updatedAt: new Date() })
			.where(eq(user.id, account.id));

		redirect(303, '/login?reset=1');
	}
};
