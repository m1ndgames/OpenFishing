/**
 * OpenFishing production entry point (`node server/index.js`).
 *
 * adapter-node builds `url.origin` from the `Host` header and assumes the scheme is
 * `https` whenever no `PROTOCOL_HEADER` is present (adapter-node `src/handler.js`).
 * On a plain-HTTP deployment that makes SvelteKit compare the browser's
 * `Origin: http://host:3000` against its own belief `https://host:3000` and reject
 * every form submission with "Cross-site POST form submissions are forbidden" (#114).
 *
 * SvelteKit 3 removed `ORIGIN`, and its replacement `kit.paths.origin` is baked into
 * the build — no use to anyone running our prebuilt Docker image. So this wrapper
 * tells the adapter the truth at runtime, derived from `BASE_URL`, then hands over to
 * adapter-node's own server, which keeps graceful shutdown, socket activation, the
 * various timeouts and `BODY_SIZE_LIMIT` exactly as they were.
 *
 * SvelteKit's CSRF check itself is untouched and stays on.
 */
import process from 'node:process';
import { schemeFromBaseUrl, schemeMismatch } from './origin.js';

/** Header adapter-node is told to read the scheme from. */
const SCHEME_HEADER = 'x-forwarded-proto';

/** Methods SvelteKit runs its CSRF origin check on. */
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const baseUrl = process.env.BASE_URL;
const scheme = schemeFromBaseUrl(baseUrl);

/**
 * A `PROTOCOL_HEADER` set by the operator means a reverse proxy in front of us is
 * authoritative about the scheme. We then keep our hands off entirely.
 */
const proxyConfigured = Boolean(process.env.PROTOCOL_HEADER);

if (!proxyConfigured) {
	if (!baseUrl) {
		console.warn(
			'[openfishing] BASE_URL is not set, so the request origin is assumed to be https. ' +
				'If you serve OpenFishing over plain HTTP (for example http://192.168.1.50:3000), ' +
				'set BASE_URL to that exact URL — otherwise every form submission is rejected with ' +
				'"Cross-site POST form submissions are forbidden".'
		);
	} else if (!scheme) {
		console.warn(
			`[openfishing] BASE_URL ("${baseUrl}") is not a valid http:// or https:// URL, so the ` +
				'request origin is assumed to be https. Set BASE_URL to the full public URL of this ' +
				'instance, including the scheme.'
		);
	} else {
		// Read by adapter-node when it constructs `url.origin`. Set before the import below,
		// because its handler module reads this env var once at load time.
		process.env.PROTOCOL_HEADER = SCHEME_HEADER;
	}
}

const { server } = await import('../build/index.js');

if (!proxyConfigured) {
	// The adapter registered its own 'request' listener while importing, so prepending puts
	// ours first: headers are rewritten synchronously before the adapter reads them. The
	// server is listening by now, but no connection can be accepted before this microtask
	// completes, so no request can slip past.
	server.prependListener('request', (req, res) => {
		// Overwrite rather than fill in: a client-supplied x-forwarded-proto must not be able
		// to move our origin, and with BASE_URL set the operator has already told us the truth.
		if (scheme) req.headers[SCHEME_HEADER] = scheme;

		watchForSchemeMismatch(req, res, scheme ?? 'https');
	});
}

/** Logged at most once per process, so auth and demo-mode 403s can't turn it into a spam loop. */
let hintLogged = false;

/**
 * Explain a rejected submission that differs from our origin only in its scheme — the
 * failure mode of #114, whose stock message says nothing about `BASE_URL`.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 * @param {string} effectiveScheme scheme the server will end up believing in
 */
function watchForSchemeMismatch(req, res, effectiveScheme) {
	if (hintLogged) return;

	const method = req.method?.toUpperCase();
	if (!method || !UNSAFE_METHODS.has(method)) return;

	const origin = req.headers.origin;
	const host = req.headers.host;
	if (!origin || !host) return;

	const derivedOrigin = `${effectiveScheme}://${host}`;
	if (!schemeMismatch(origin, derivedOrigin)) return;

	res.on('finish', () => {
		if (hintLogged || res.statusCode !== 403) return;
		hintLogged = true;

		console.warn(
			`[openfishing] Rejected a ${method} from origin ${origin} because this server believes ` +
				`its own origin is ${derivedOrigin} — the two differ only in their scheme. ` +
				(baseUrl
					? `Set BASE_URL (currently "${baseUrl}") to the URL users actually open, `
					: 'Set BASE_URL to the URL users actually open, ') +
				'or set PROTOCOL_HEADER if a reverse proxy in front of this app reports the scheme. ' +
				'This hint is logged once per restart.'
		);
	});
}
