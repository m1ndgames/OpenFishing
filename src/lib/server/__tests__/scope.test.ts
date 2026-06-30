import { describe, it, expect } from 'vitest';
import { sql } from 'drizzle-orm';
import { userFilter, ownerId } from '../scope';
import { lure } from '../db/schema';

describe('userFilter', () => {
	it('returns a condition scoped to the user when logged in', () => {
		const cond = userFilter({ user: { id: 'u1' } } as any, lure.userId);
		expect(cond).toBeDefined();
		// It should be an equality SQL chunk, not undefined.
		expect(typeof cond).toBe('object');
	});

	it('returns undefined (no filter) in open mode', () => {
		expect(userFilter({ user: null } as any, lure.userId)).toBeUndefined();
	});

	it('tolerates an undefined locals (test ergonomics)', () => {
		expect(userFilter(undefined as any, lure.userId)).toBeUndefined();
	});
});

describe('ownerId', () => {
	it('returns the user id when logged in', () => {
		expect(ownerId({ user: { id: 'u1' } } as any)).toBe('u1');
	});

	it('returns null in open mode or when locals is missing', () => {
		expect(ownerId({ user: null } as any)).toBeNull();
		expect(ownerId(undefined as any)).toBeNull();
	});
});

// guard against unused import warning while documenting intent
void sql;
