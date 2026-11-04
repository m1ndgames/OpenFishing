import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SESSION_COOKIE_NAME, sessionCookieValue } from '#lib/server/auth.js';
import {
	OIDC_FLOW_COOKIE,
	OidcLoginError,
	completeOidcLogin,
	decodeFlow,
	oidcEnabled,
	rebaseOnBaseUrl,
	resolveOidcUser
} from '#lib/server/oidc.js';

export const GET: RequestHandler = async ({ url, cookies }) => {
	if (!oidcEnabled()) redirect(303, '/login');

	const flow = decodeFlow(cookies.get(OIDC_FLOW_COOKIE));
	cookies.delete(OIDC_FLOW_COOKIE, { path: '/login/oidc' });

	if (url.searchParams.get('error')) redirect(303, '/login?oidc_error=denied');
	if (!flow) redirect(303, '/login?oidc_error=failed');

	let account;
	try {
		const claims = await completeOidcLogin(rebaseOnBaseUrl(url), flow);
		account = await resolveOidcUser(claims);
	} catch (err) {
		if (err instanceof OidcLoginError) redirect(303, `/login?oidc_error=${err.code}`);
		console.error('[oidc] login failed:', err);
		redirect(303, '/login?oidc_error=failed');
	}

	cookies.set(SESSION_COOKIE_NAME, sessionCookieValue(account), {
		path: '/',
		httpOnly: true,
		sameSite: 'strict',
		secure: false,
		maxAge: 60 * 60 * 24 * 365
	});

	// A Strict cookie is withheld from requests in a redirect chain that began on another
	// site, so a 303 straight to "/" would bounce the fresh session back to /login. Answer
	// with a page instead and let the browser navigate from our own origin.
	return new Response(
		'<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=/"><title>OpenFishing</title><script>location.replace("/")</script>',
		{ headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
	);
};
