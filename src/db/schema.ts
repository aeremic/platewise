import { sql } from 'drizzle-orm';
import { index, integer, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import type { HealthLevel } from '@/domain/health';

// Migrations must never lose data: only add nullable/defaulted columns and new tables.
// src/db/__tests__/migrations.test.ts enforces this for every file in drizzle/.

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
    /** Hidden from pickers but kept so past entries still resolve; restorable from Categories. */
    archivedAt: text('archived_at'),
    /** Removed for good (e.g. by "Restore defaults"); kept only so past entries still resolve. */
    deletedAt: text('deleted_at'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
    updatedAt: text('updated_at').notNull().default(sql`(datetime('now'))`),
    /** What one portion is, e.g. "2 slices". */
    portionLabel: text('portion_label'),
    // Per portion; null = unknown.
    kcal: real('kcal'),
    fiberG: real('fiber_g'),
    sugarG: real('sugar_g'),
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
    portions: real('portions').notNull().default(1),
    // Totals for this entry, snapshotted when logged (portions already applied).
    // null = not recorded: falls back to the category's values × portions.
    kcal: real('kcal'),
    fiberG: real('fiber_g'),
    sugarG: real('sugar_g'),
  },
  (t) => [index('entries_date_idx').on(t.date), index('entries_category_idx').on(t.categoryId)],
);

/**
 * Goal history: the goals for a day are the row with the latest `effectiveFrom` on or before it,
 * so changing goals doesn't re-judge past days. Null goal = turned off.
 */
export const dailyGoals = sqliteTable(
  'daily_goals',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    /** 'YYYY-MM-DD'; the initial row uses '0000-01-01' so it covers all history. */
    effectiveFrom: text('effective_from').notNull(),
    kcalMax: real('kcal_max'),
    fiberMin: real('fiber_min'),
    sugarMax: real('sugar_max'),
    createdAt: text('created_at').notNull().default(sql`(datetime('now'))`),
  },
  (t) => [uniqueIndex('daily_goals_effective_from_idx').on(t.effectiveFrom)],
);

export type Category = typeof categories.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type DailyGoals = typeof dailyGoals.$inferSelect;
