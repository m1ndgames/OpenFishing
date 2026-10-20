import { defineEnvVars } from '@sveltejs/kit/env';

// SvelteKit 3 only exposes environment variables that are declared here — an undeclared
// variable is silently `undefined` at runtime (even via the deprecated `$env/*` modules).
// All are private (server-only) and dynamic (read when the server starts), so one Docker
// image can be configured per deployment. Server code reads them via `#lib/server/env.js`.

/**
 * Every variable is optional: each has a default or gates an optional feature. Without a
 * schema SvelteKit treats an unset variable as an error and refuses to start, so pass the
 * value through (this also types it as `string | undefined`).
 */
const optional = (description: string) => ({
	description,
	schema: (value: string | undefined) => value
});

export const variables = defineEnvVars({
	DATABASE_URL: optional('Path to the SQLite database file (default: local.db)'),
	UPLOAD_PATH: optional('Directory for uploaded photos (default: ./uploads)'),
	BASE_URL: optional('Public base URL, used for QR code and password-reset links'),

	ADMIN_PASSWORD: optional('Enables multi-user login; the admin account password'),
	AUTH_PASSWORD: optional('Deprecated fallback name for ADMIN_PASSWORD'),

	SMTP_HOST: optional('SMTP server for password-reset emails'),
	SMTP_PORT: optional('SMTP port (default: 587; 465 implies TLS)'),
	SMTP_SECURE: optional('Set to "true" for implicit TLS'),
	SMTP_USER: optional('SMTP username (omit for unauthenticated relays)'),
	SMTP_PASS: optional('SMTP password'),
	SMTP_FROM: optional('From address for password-reset emails'),

	DEMO_MODE: optional('Any value enables read-only demo mode'),

	CHATBOT: optional('Any truthy value enables the AI chatbot'),
	LITELLM_URL: optional('Base URL of the LiteLLM proxy'),
	LITELLM_MODEL: optional('LiteLLM model name for the chatbot'),
	LITELLM_VISION_MODEL: optional('Optional vision model for fish/lure identification')
});
