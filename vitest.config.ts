import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
	resolve: {
		alias: {
			'$env/dynamic/private': new URL('./src/__mocks__/env.ts', import.meta.url).pathname,
			'$lib': fileURLToPath(new URL('./src/lib', import.meta.url)),
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
