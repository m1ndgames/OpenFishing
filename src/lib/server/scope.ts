import { eq, type SQL } from 'drizzle-orm';
import type { SQLiteColumn } from 'drizzle-orm/sqlite-core';

/**
 * Returns a `userId = <current user>` condition when a user is logged in, or `undefined`
 * (no filter) in open mode (`AUTH_PASSWORD` unset). Combine with other conditions via
 * `and(...)` — drizzle ignores `undefined` operands.
 */
export function userFilter(locals: App.Locals, column: SQLiteColumn): SQL | undefined {
	return locals?.user ? eq(column, locals.user.id) : undefined;
}

/** The userId to stamp on inserts (null in open mode). */
export function ownerId(locals: App.Locals): string | null {
	return locals?.user?.id ?? null;
}
