import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import {
	user,
	lure,
	spot,
	spotPhoto,
	fishCatch,
	catchPhoto,
	rod,
	reel,
	fishingLine,
	combo
} from '$lib/server/db/schema';
import { asc, eq, inArray } from 'drizzle-orm';
import { hashPassword, generateApiToken, DEFAULT_QUOTA_BYTES, reprovisionAdmin } from '$lib/server/auth';
import { deleteUpload, getUsedBytes } from '$lib/server/uploads';
import { parseBackupZip, restoreAllBackup, BackupError } from '$lib/server/backup';

const MB = 1024 * 1024;

function parseQuotaMb(raw: string | null): number | null {
	if (raw == null || raw.trim() === '') return null; // unlimited
	const n = parseFloat(raw);
	if (isNaN(n) || n < 0) return null;
	return Math.round(n * MB);
}

export const load: PageServerLoad = async () => {
	const rows = await db
		.select({
			id: user.id,
			email: user.email,
			username: user.username,
			isAdmin: user.isAdmin,
			disabled: user.disabled,
			quotaBytes: user.quotaBytes,
			chatbotEnabled: user.chatbotEnabled,
			apiToken: user.apiToken,
			createdAt: user.createdAt
		})
		.from(user)
		.orderBy(asc(user.username));

	// Storage usage is computed from disk on demand (no stored counter to drift).
	const users = await Promise.all(rows.map(async (u) => ({ ...u, usedBytes: await getUsedBytes(u.id) })));

	return { users, chatbotConfigured: !!env.CHATBOT };
};

async function findUser(id: string) {
	return db.query.user.findFirst({ where: eq(user.id, id) });
}

export const actions: Actions = {
	createUser: async ({ request }) => {
		const data = await request.formData();
		const email = ((data.get('email') as string) ?? '').trim().toLowerCase();
		const username = ((data.get('username') as string) ?? '').trim();
		const password = (data.get('password') as string) ?? '';
		const quotaBytes = parseQuotaMb(data.get('quota_mb') as string);

		if (!email || !username || !password) return fail(400, { error: 'userFieldsRequired' });
		if (!email.includes('@')) return fail(400, { error: 'invalidEmail' });

		const clash = await db.query.user.findFirst({
			where: (u, { or, eq: eqOp }) => or(eqOp(u.email, email), eqOp(u.username, username))
		});
		if (clash) return fail(409, { error: 'userExists' });

		await db.insert(user).values({
			email,
			username,
			passwordHash: await hashPassword(password),
			quotaBytes: quotaBytes ?? DEFAULT_QUOTA_BYTES,
			apiToken: generateApiToken()
		});
		return { success: 'userCreated' };
	},

	updateUser: async ({ request }) => {
		const data = await request.formData();
		const id = (data.get('id') as string) ?? '';
		const target = await findUser(id);
		if (!target) return fail(404, { error: 'userNotFound' });

		const email = ((data.get('email') as string) ?? '').trim().toLowerCase();
		const username = ((data.get('username') as string) ?? '').trim();
		const quotaBytes = parseQuotaMb(data.get('quota_mb') as string);

		if (!email || !username) return fail(400, { error: 'userFieldsRequired' });
		if (!email.includes('@')) return fail(400, { error: 'invalidEmail' });

		// Uniqueness check against other users
		const clash = await db.query.user.findFirst({
			where: (u, { or, eq: eqOp, and: andOp, ne }) =>
				andOp(ne(u.id, id), or(eqOp(u.email, email), eqOp(u.username, username)))
		});
		if (clash) return fail(409, { error: 'userExists' });

		// The admin account's email/username are env-controlled; only quota etc. are editable.
		const set: Partial<typeof user.$inferInsert> = { quotaBytes, updatedAt: new Date() };
		if (!target.isAdmin) {
			set.email = email;
			set.username = username;
		}
		await db.update(user).set(set).where(eq(user.id, id));

		const newPassword = (data.get('password') as string) ?? '';
		if (newPassword && !target.isAdmin) {
			await db.update(user).set({ passwordHash: await hashPassword(newPassword) }).where(eq(user.id, id));
		}
		return { success: 'userUpdated' };
	},

	toggleDisabled: async ({ request }) => {
		const data = await request.formData();
		const id = (data.get('id') as string) ?? '';
		const target = await findUser(id);
		if (!target) return fail(404, { error: 'userNotFound' });
		if (target.isAdmin) return fail(400, { error: 'cannotModifyAdmin' });
		await db.update(user).set({ disabled: !target.disabled, updatedAt: new Date() }).where(eq(user.id, id));
		return { success: 'userUpdated' };
	},

	toggleChatbot: async ({ request }) => {
		const data = await request.formData();
		const id = (data.get('id') as string) ?? '';
		const target = await findUser(id);
		if (!target) return fail(404, { error: 'userNotFound' });
		await db.update(user).set({ chatbotEnabled: !target.chatbotEnabled, updatedAt: new Date() }).where(eq(user.id, id));
		return { success: 'userUpdated' };
	},

	regenerateToken: async ({ request }) => {
		const data = await request.formData();
		const id = (data.get('id') as string) ?? '';
		const target = await findUser(id);
		if (!target) return fail(404, { error: 'userNotFound' });
		await db.update(user).set({ apiToken: generateApiToken(), updatedAt: new Date() }).where(eq(user.id, id));
		return { success: 'tokenRegenerated' };
	},

	deleteUser: async ({ request }) => {
		const data = await request.formData();
		const id = (data.get('id') as string) ?? '';
		const target = await findUser(id);
		if (!target) return fail(404, { error: 'userNotFound' });
		if (target.isAdmin) return fail(400, { error: 'cannotDeleteAdmin' });

		// Collect the user's photo files before deleting their rows.
		const [lurePhotos, userSpots, userCatches] = await Promise.all([
			db.select({ photoPath: lure.photoPath }).from(lure).where(eq(lure.userId, id)),
			db.select({ id: spot.id }).from(spot).where(eq(spot.userId, id)),
			db.select({ id: fishCatch.id }).from(fishCatch).where(eq(fishCatch.userId, id))
		]);
		const spotIds = userSpots.map((s) => s.id);
		const catchIds = userCatches.map((c) => c.id);
		const [spotPhotos, catchPhotos] = await Promise.all([
			spotIds.length ? db.select({ filename: spotPhoto.filename }).from(spotPhoto).where(inArray(spotPhoto.spotId, spotIds)) : Promise.resolve([]),
			catchIds.length ? db.select({ filename: catchPhoto.filename }).from(catchPhoto).where(inArray(catchPhoto.catchId, catchIds)) : Promise.resolve([])
		]);

		// Delete top-level owned rows (children cascade via their own FKs).
		for (const table of [fishCatch, spot, lure, combo, reel, rod, fishingLine] as const) {
			await db.delete(table).where(eq(table.userId, id));
		}
		// userSetting + chatMessage cascade via user FK.
		await db.delete(user).where(eq(user.id, id));

		// Reclaim photo files from disk.
		const filenames = [
			...lurePhotos.map((l) => l.photoPath).filter((p): p is string => !!p),
			...spotPhotos.map((p) => p.filename),
			...catchPhotos.map((p) => p.filename)
		];
		await Promise.all(filenames.map((fn) => deleteUpload(fn)));

		return { success: 'userDeleted' };
	},

	restoreAll: async ({ request }) => {
		const data = await request.formData();
		const file = data.get('backup') as File;
		if (!file || file.size === 0) return fail(400, { error: 'backupErrorNoFile' });
		if (!file.name.endsWith('.zip')) return fail(400, { error: 'backupErrorNotZip' });

		try {
			const { payload, extractPhotos } = parseBackupZip(Buffer.from(await file.arrayBuffer()), 'all');
			extractPhotos();
			const result = restoreAllBackup(payload);
			// Guarantee the env admin can still log in after a full wipe + rebuild.
			await reprovisionAdmin();
			return { success: 'restoreAllDone', restored: result };
		} catch (e) {
			if (e instanceof BackupError) return fail(e.key === 'backupErrorSchema' ? 409 : 400, { error: e.key });
			throw e;
		}
	}
};
