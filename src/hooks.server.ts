import { redirect, type Handle } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import {
	SESSION_COOKIE_NAME,
	ensureAdminUser,
	resolveSessionUser,
	toSessionUser
} from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;

	// Demo mode: block all writes except the lang preference toggle
	if (env.DEMO_MODE && event.request.method !== 'GET' && event.request.method !== 'HEAD') {
		if (event.url.pathname !== '/api/lang' && event.url.pathname !== '/api/chat' && event.url.pathname !== '/api/identify-fish' && event.url.pathname !== '/api/identify-lure') {
			if (event.url.pathname.startsWith('/api/')) {
				return Response.json({ error: 'Demo mode — write access is disabled' }, { status: 403 });
			}
			redirect(303, event.url.pathname);
		}
	}

	const password = env.AUTH_PASSWORD;

	// Auth disabled when no password is configured — fully open, single-tenant.
	if (!password) return resolve(event);

	// Ensure the admin account exists and existing data is owned (runs once per process).
	await ensureAdminUser();

	// Login, logout and share pages are always accessible
	if (event.url.pathname === '/login') return resolve(event);
	if (event.url.pathname === '/logout') return resolve(event);
	if (event.url.pathname.startsWith('/share/')) return resolve(event);
	if (event.url.pathname.startsWith('/uploads/')) return resolve(event);

	// API v1: authenticate via per-user Bearer token, not session cookie
	if (event.url.pathname.startsWith('/api/v1/')) {
		const authHeader = event.request.headers.get('authorization');
		const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
		const apiUser = bearer ? await db.query.user.findFirst({ where: eq(user.apiToken, bearer) }) : null;
		if (!apiUser || apiUser.disabled) {
			return Response.json({ error: 'Unauthorized' }, { status: 401 });
		}
		event.locals.user = toSessionUser(apiUser);
		return resolve(event);
	}

	// Session cookie for everything else
	const sessionUser = await resolveSessionUser(event.cookies.get(SESSION_COOKIE_NAME));
	if (!sessionUser) {
		event.cookies.delete(SESSION_COOKIE_NAME, { path: '/' });
		redirect(303, '/login');
	}
	event.locals.user = sessionUser;

	// Admin-only area
	if (event.url.pathname.startsWith('/admin')) {
		if (!sessionUser.isAdmin) {
			if (event.url.pathname.startsWith('/admin/api') || event.request.headers.get('accept')?.includes('application/json')) {
				return Response.json({ error: 'Forbidden' }, { status: 403 });
			}
			redirect(303, '/');
		}
	}

	return resolve(event);
};
