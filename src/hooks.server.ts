import { redirect, type Handle } from '@sveltejs/kit';
import { createHmac } from 'node:crypto';
import { env } from '$env/dynamic/private';

function sessionToken(password: string): string {
	return createHmac('sha256', password).update('openfishing-session').digest('hex');
}

export const handle: Handle = async ({ event, resolve }) => {
	// Demo mode: block all writes except the lang preference toggle
	if (env.DEMO_MODE && event.request.method !== 'GET' && event.request.method !== 'HEAD') {
		if (event.url.pathname !== '/api/lang') {
			if (event.url.pathname.startsWith('/api/')) {
				return Response.json({ error: 'Demo mode — write access is disabled' }, { status: 403 });
			}
			redirect(303, event.url.pathname);
		}
	}

	const password = env.AUTH_PASSWORD;

	// Auth disabled when no password is configured
	if (!password) return resolve(event);

	// Login and share pages are always accessible
	if (event.url.pathname === '/login') return resolve(event);
	if (event.url.pathname.startsWith('/share/')) return resolve(event);
	if (event.url.pathname.startsWith('/uploads/')) return resolve(event);

	const token = event.cookies.get('of_session');
	if (token !== sessionToken(password)) {
		redirect(303, '/login');
	}

	return resolve(event);
};
