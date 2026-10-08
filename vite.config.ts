import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// Behind a reverse proxy the request origin comes from the Host header (https by
			// default) or the PROTOCOL_HEADER / HOST_HEADER env vars. adapter-node has no
			// `trustProxy` option — the one configured previously was silently ignored.
			adapter: adapter()
		})
	]
});
