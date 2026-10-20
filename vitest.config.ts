import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	resolve: {
		alias: {
			// Must precede '#lib': the env wrapper imports $app/env/private, which only exists under the SvelteKit plugin
			'#lib/server/env.js': fileURLToPath(new URL('./src/__mocks__/env.ts', import.meta.url)),
			'#lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
		},
	},
	test: {
		include: ['src/**/*.test.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			include: ['src/**/*.ts'],
			exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/__mocks__/**'],
		},
	},
});
