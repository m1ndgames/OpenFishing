import { redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { authEnabled, findUserByEmail, generateResetToken } from '$lib/server/auth';
import { mailConfigured, sendPasswordResetEmail } from '$lib/server/mail';
import { translations, defaultLang, SUPPORTED_LANGS, type Lang } from '$lib/i18n';

function guard() {
	if (!authEnabled() || !mailConfigured()) redirect(303, '/login');
}

export const load: PageServerLoad = async () => {
	guard();
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		guard();
		const data = await request.formData();
		const email = ((data.get('email') as string) ?? '').trim().toLowerCase();

		// Always respond the same way regardless of whether the email exists (no enumeration).
		if (email) {
			try {
				const account = await findUserByEmail(email);
				if (account && account.email && !account.disabled) {
					const { token, hash, expiry } = generateResetToken();
					await db
						.update(user)
						.set({ resetTokenHash: hash, resetTokenExpiry: expiry, updatedAt: new Date() })
						.where(eq(user.id, account.id));

					const cookieLang = cookies.get('lang') ?? '';
					const lang: Lang = SUPPORTED_LANGS.includes(cookieLang as Lang) ? (cookieLang as Lang) : defaultLang;
					const baseUrl = (env.BASE_URL ?? url.origin).replace(/\/$/, '');
					const resetUrl = `${baseUrl}/reset-password?token=${token}`;
					await sendPasswordResetEmail(account.email, resetUrl, translations[lang]);
				}
			} catch (e) {
				console.error('[forgot-password] failed to send reset email:', e);
				// Still fall through to the generic success response.
			}
		}

		return { sent: true };
	}
};
