import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OIDC_FLOW_COOKIE, OIDC_FLOW_MAX_AGE, beginOidcLogin, encodeFlow, oidcEnabled } from '#lib/server/oidc.js';

/** Start the OIDC authorization-code flow: stash PKCE/state/nonce in a cookie, redirect to the IdP. */
export const GET: RequestHandler = async ({ cookies }) => {
	if (!oidcEnabled()) redirect(303, '/login');

	let target: URL;
	try {
		const { url, flow } = await beginOidcLogin();
		target = url;
		cookies.set(OIDC_FLOW_COOKIE, encodeFlow(flow), {
			path: '/login/oidc',
			httpOnly: true,
			// Lax, not Strict: the browser returns from the IdP via a cross-site navigation.
			sameSite: 'lax',
			secure: false,
			maxAge: OIDC_FLOW_MAX_AGE
		});
	} catch (err) {
		console.error('[oidc] could not start login:', err);
		redirect(303, '/login?oidc_error=failed');
	}
	// SvelteKit's redirect() refuses external URLs, so build the 302 by hand. Cookies set via
	// `cookies` are merged into this response by the framework.
	return new Response(null, { status: 302, headers: { location: target.toString() } });
};
