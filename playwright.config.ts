import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './e2e',
	// The auth-enabled suite has its own config (playwright.auth.config.ts) + server.
	testIgnore: '**/auth/**',
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: 'http://localhost:5174',
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	],
	webServer: {
		command: 'npm run dev:e2e',
		port: 5174,
		reuseExistingServer: false,
		env: {
			DATABASE_URL: 'e2e/test.db',
			UPLOAD_PATH: 'e2e/uploads',
			AUTH_PASSWORD: '',
			DEMO_MODE: '',
			CHATBOT: '',
		},
		timeout: 60_000,
	},
	globalSetup: './e2e/global-setup.ts',
});
