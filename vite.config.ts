import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// NO_AUTORELOAD=1 turns off file watching and HMR for the dev server. Every SSR module reload
// re-runs the admin sync (a fresh password salt), which invalidates the session cookie, so
// long browser sessions (manual testing, screenshot audits) set this and restart on demand.
const noAutoReload = !!process.env.NO_AUTORELOAD;

export default defineConfig({
	server: noAutoReload ? { watch: null, hmr: false } : undefined,
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) => filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			// The request origin comes from the Host header, with the scheme taken from
			// PROTOCOL_HEADER / HOST_HEADER and assumed to be `https` otherwise. `paths.origin`
			// is baked into the build, so it can't configure a prebuilt image — instead
			// `server/index.js` (the production entry point) derives the scheme from BASE_URL at
			// runtime and feeds it to the adapter. adapter-node has no `trustProxy` option.
			adapter: adapter()
		})
	]
});
