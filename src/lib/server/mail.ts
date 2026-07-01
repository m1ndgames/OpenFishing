import nodemailer from 'nodemailer';
import { env } from '$env/dynamic/private';
import type { Translations } from '$lib/i18n';

/**
 * Whether outbound email (password reset) is configured. Requires at least an SMTP host
 * and a From address. When false, the forgot-password feature is hidden/disabled.
 */
export function mailConfigured(): boolean {
	return !!(env.SMTP_HOST && env.SMTP_FROM);
}

function createTransport() {
	const port = env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587;
	return nodemailer.createTransport({
		host: env.SMTP_HOST,
		port,
		secure: env.SMTP_SECURE === 'true' || port === 465,
		auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined
	});
}

/** Send a password-reset email. Throws if sending fails (caller decides how to surface it). */
export async function sendPasswordResetEmail(to: string, resetUrl: string, t: Translations): Promise<void> {
	const transporter = createTransport();
	const subject = t.resetEmailSubject;
	const intro = t.resetEmailIntro;
	const button = t.resetEmailButton;
	const ignore = t.resetEmailIgnore;

	const text = `${intro}\n\n${resetUrl}\n\n${ignore}`;
	const html = `<div style="font-family:system-ui,sans-serif;line-height:1.6;color:#1e293b;">
		<p>${intro}</p>
		<p><a href="${resetUrl}" style="display:inline-block;background:#06b6d4;color:#fff;font-weight:700;padding:10px 18px;border-radius:8px;text-decoration:none;">${button}</a></p>
		<p style="font-size:0.85rem;color:#64748b;">${ignore}</p>
		<p style="font-size:0.8rem;color:#94a3b8;word-break:break-all;">${resetUrl}</p>
	</div>`;

	await transporter.sendMail({ from: env.SMTP_FROM, to, subject, text, html });
}
