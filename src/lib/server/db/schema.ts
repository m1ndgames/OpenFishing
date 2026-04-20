import { integer, sqliteTable, text, real } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

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
	weather: text('weather'),
	qrCoded: integer('qr_coded', { mode: 'boolean' }).notNull().default(false),
	createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date())
});

export const tag = sqliteTable('tag', {
	id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
	lureId: text('lure_id')
		.notNull()
		.references(() => lure.id, { onDelete: 'cascade' }),
	name: text('name').notNull()
});

export const lureRelations = relations(lure, ({ many }) => ({
	tags: many(tag)
}));

export const tagRelations = relations(tag, ({ one }) => ({
	lure: one(lure, { fields: [tag.lureId], references: [lure.id] })
}));
