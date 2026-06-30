import { defineConfig, devices } from '@playwright/test';

// Auth-enabled (multi-user) E2E suite. Runs on its own port (5175) and DB
// (e2e/test-auth.db) with AUTH_PASSWORD set, so it never collides with the
// open-mode suite (playwright.config.ts, port 5174).
export default defineConfig({
	testDir: './e2e/auth',
	testMatch: '**/*.test.ts',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: 'http://localhost:5175',
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	],
	webServer: {
		command: 'npm run dev:e2e:auth',
		port: 5175,
		reuseExistingServer: false,
		env: {
			DATABASE_URL: 'e2e/test-auth.db',
			UPLOAD_PATH: 'e2e/uploads-auth',
			AUTH_PASSWORD: 'e2e-secret',
			ADMIN_EMAIL: 'admin@openfishing.local',
			DEMO_MODE: '',
			CHATBOT: '',
		},
		timeout: 60_000,
	},
	globalSetup: './e2e/auth/global-setup.ts',
});
