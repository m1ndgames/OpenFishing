/**
 * Pure helpers for working out which scheme OpenFishing is actually served over.
 *
 * Kept free of any Node or SvelteKit imports so they can be unit tested directly
 * (see `server/__tests__/origin.test.ts`).
 */

/**
 * The scheme (`'http'` or `'https'`) declared by `BASE_URL`.
 *
 * Returns `null` when `BASE_URL` is unset, unparseable, or uses a scheme that can't
 * serve the app (`ftp:`, `file:`, …) — callers then fall back to adapter-node's own
 * `https` assumption rather than guessing.
 *
 * @param {string | undefined | null} baseUrl value of the `BASE_URL` env var
 * @returns {'http' | 'https' | null}
 */
export function schemeFromBaseUrl(baseUrl) {
	if (typeof baseUrl !== 'string' || baseUrl.trim() === '') return null;

	let parsed;
	try {
		parsed = new URL(baseUrl.trim());
	} catch {
		return null;
	}

	const scheme = parsed.protocol.replace(/:$/, '').toLowerCase();
	return scheme === 'http' || scheme === 'https' ? scheme : null;
}

/**
 * True when two origins are the same host but a different scheme — the signature of
 * issue #114, as opposed to a genuine cross-site submission.
 *
 * Both sides are parsed as URLs so default ports normalise away: `http://nas:80` and
 * `https://nas` both reduce to the host `nas`.
 *
 * @param {string | string[] | undefined | null} origin the browser's `Origin` header
 * @param {string | undefined | null} derivedOrigin the origin the server believes it has
 * @returns {boolean}
 */
export function schemeMismatch(origin, derivedOrigin) {
	if (typeof origin !== 'string' || typeof derivedOrigin !== 'string') return false;

	let browser;
	let server;
	try {
		browser = new URL(origin);
		server = new URL(derivedOrigin);
	} catch {
		return false;
	}

	if (browser.protocol === server.protocol) return false;
	return browser.host === server.host;
}
