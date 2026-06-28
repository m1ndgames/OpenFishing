import { defineConfig } from 'vitest/config';

export default defineConfig({
	resolve: {
		alias: {
			'$env/dynamic/private': new URL('./src/__mocks__/env.ts', import.meta.url).pathname,
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
