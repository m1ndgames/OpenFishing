import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// ── Tables ────────────────────────────────────────────────────────────────────

export const lure = sqliteTable('lure', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	lureNumber: integer('lure_number'),
	name: text('name').notNull(),
	brand: text('brand'),
	type: text('type'),
	color: text('color'),
	weight: real('weight'),
	size: text('size'),
	notes: text('notes'),
	photoPath: text('photo_path'),
	species: text('species'),
	runningDepth: text('running_depth'),
	waterType: text('water_type'),
	lightConditions: integer('light_conditions'),
	amount: integer('amount').notNull().default(1),
	favourite: integer('favourite', { mode: 'boolean' }).notNull().default(false),
	qrCoded: integer('qr_coded', { mode: 'boolean' }).notNull().default(false),
	lost: integer('lost', { mode: 'boolean' }).notNull().default(false),
	shareToken: text('share_token'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const tag = sqliteTable('tag', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	lureId: text('lure_id').notNull().references(() => lure.id, { onDelete: 'cascade' }),
	name: text('name').notNull()
});

export const spot = sqliteTable('spot', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	lat: real('lat').notNull(),
	lng: real('lng').notNull(),
	notes: text('notes'),
	shareToken: text('share_token'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const spotTag = sqliteTable('spot_tag', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	spotId: text('spot_id').notNull().references(() => spot.id, { onDelete: 'cascade' }),
	name: text('name').notNull()
});

export const spotPhoto = sqliteTable('spot_photo', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	spotId: text('spot_id').notNull().references(() => spot.id, { onDelete: 'cascade' }),
	filename: text('filename').notNull(),
	sortOrder: integer('sort_order').notNull().default(0)
});

export const rod = sqliteTable('rod', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	brand: text('brand'),
	model: text('model').notNull(),
	lengthM: real('length_m'),
	castingWeight: text('casting_weight'),
	type: text('type'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const reel = sqliteTable('reel', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	brand: text('brand'),
	model: text('model').notNull(),
	size: text('size'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const fishingLine = sqliteTable('fishing_line', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	brand: text('brand'),
	model: text('model').notNull(),
	type: text('type'),
	diameterMm: real('diameter_mm'),
	strengthKg: real('strength_kg'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const reelLineLog = sqliteTable('reel_line_log', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	reelId: text('reel_id').notNull().references(() => reel.id, { onDelete: 'cascade' }),
	lineId: text('line_id').references(() => fishingLine.id, { onDelete: 'set null' }),
	spooledAt: integer('spooled_at', { mode: 'timestamp' }).notNull(),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const combo = sqliteTable('combo', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	name: text('name').notNull(),
	rodId: text('rod_id').references(() => rod.id, { onDelete: 'set null' }),
	reelId: text('reel_id').references(() => reel.id, { onDelete: 'set null' }),
	terminalTackle: text('terminal_tackle'),
	notes: text('notes'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const fishCatch = sqliteTable('fish_catch', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	caughtAt: integer('caught_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
	species: text('species'),
	weightG: real('weight_g'),
	lengthCm: real('length_cm'),
	lat: real('lat'),
	lng: real('lng'),
	notes: text('notes'),
	catchAndRelease: integer('catch_and_release', { mode: 'boolean' }).notNull().default(false),
	presentation: text('presentation'),
	biteIndex: real('bite_index'),
	lureId: text('lure_id').references(() => lure.id, { onDelete: 'set null' }),
	comboId: text('combo_id').references(() => combo.id, { onDelete: 'set null' }),
	shareToken: text('share_token'),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const catchPhoto = sqliteTable('catch_photo', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	catchId: text('catch_id').notNull().references(() => fishCatch.id, { onDelete: 'cascade' }),
	filename: text('filename').notNull(),
	sortOrder: integer('sort_order').notNull().default(0)
});

// ── Relations ─────────────────────────────────────────────────────────────────

export const lureRelations = relations(lure, ({ many }) => ({
	tags: many(tag)
}));

export const tagRelations = relations(tag, ({ one }) => ({
	lure: one(lure, { fields: [tag.lureId], references: [lure.id] })
}));

export const spotRelations = relations(spot, ({ many }) => ({
	tags: many(spotTag),
	photos: many(spotPhoto)
}));

export const spotTagRelations = relations(spotTag, ({ one }) => ({
	spot: one(spot, { fields: [spotTag.spotId], references: [spot.id] })
}));

export const spotPhotoRelations = relations(spotPhoto, ({ one }) => ({
	spot: one(spot, { fields: [spotPhoto.spotId], references: [spot.id] })
}));

export const rodRelations = relations(rod, ({ many }) => ({
	combos: many(combo)
}));

export const reelRelations = relations(reel, ({ many }) => ({
	combos: many(combo),
	lineLogs: many(reelLineLog)
}));

export const fishingLineRelations = relations(fishingLine, ({ many }) => ({
	reelLineLogs: many(reelLineLog)
}));

export const reelLineLogRelations = relations(reelLineLog, ({ one }) => ({
	reel: one(reel, { fields: [reelLineLog.reelId], references: [reel.id] }),
	line: one(fishingLine, { fields: [reelLineLog.lineId], references: [fishingLine.id] })
}));

export const comboRelations = relations(combo, ({ one, many }) => ({
	rod: one(rod, { fields: [combo.rodId], references: [rod.id] }),
	reel: one(reel, { fields: [combo.reelId], references: [reel.id] }),
	catches: many(fishCatch)
}));

export const fishCatchRelations = relations(fishCatch, ({ one, many }) => ({
	lure: one(lure, { fields: [fishCatch.lureId], references: [lure.id] }),
	combo: one(combo, { fields: [fishCatch.comboId], references: [combo.id] }),
	photos: many(catchPhoto)
}));

export const catchPhotoRelations = relations(catchPhoto, ({ one }) => ({
	fishCatch: one(fishCatch, { fields: [catchPhoto.catchId], references: [fishCatch.id] })
}));
