import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import type { HealthLevel } from '@/domain/health';

export const categories = sqliteTable(
  'categories',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    emoji: text('emoji'),
    /** 0 = red (unhealthy), 1 = orange (moderate), 2 = green (healthy). */
    health: integer('health').$type<HealthLevel>().notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    /** Stable key for built-in categories; null for ones the user created. */
    seedKey: text('seed_key'),
    /** Hidden from pickers but kept so past entries still resolve. */
    archivedAt: text('archived_at'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex('categories_seed_key_idx').on(t.seedKey)],
);

export const entries = sqliteTable(
  'entries',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** Local calendar day, 'YYYY-MM-DD'. */
    date: text('date').notNull(),
    categoryId: integer('category_id')
      .notNull()
      .references(() => categories.id),
    // Reserved for later (meal grouping, notes); unused in v1.
    mealType: text('meal_type'),
    note: text('note'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  },
  (t) => [index('entries_date_idx').on(t.date), index('entries_category_idx').on(t.categoryId)],
);

export type Category = typeof categories.$inferSelect;
export type Entry = typeof entries.$inferSelect;
