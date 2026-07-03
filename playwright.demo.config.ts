import { defineConfig, devices } from '@playwright/test';

// Demo-mode E2E suite. Runs on its own port (5176) and DB (e2e/test-demo.db)
// with DEMO_MODE set and CHATBOT deliberately left unset — this is the key
// scenario for these tests: the chatbot widget must still appear even though
// it isn't configured, and appearance changes must preview live without
// ever reaching the server.
export default defineConfig({
	testDir: './e2e/demo',
	testMatch: '**/*.test.ts',
	fullyParallel: false,
	workers: 1,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL: 'http://localhost:5176',
		trace: 'on-first-retry',
	},
	projects: [
		{ name: 'chromium', use: { ...devices['Desktop Chrome'] } },
	],
	webServer: {
		command: 'npm run dev:e2e:demo',
		port: 5176,
		reuseExistingServer: false,
		env: {
			DATABASE_URL: 'e2e/test-demo.db',
			UPLOAD_PATH: 'e2e/uploads-demo',
			ADMIN_PASSWORD: '',
			AUTH_PASSWORD: '',
			DEMO_MODE: '1',
			CHATBOT: '',
			LITELLM_URL: '',
			LITELLM_MODEL: '',
		},
		timeout: 60_000,
	},
	globalSetup: './e2e/demo/global-setup.ts',
});
