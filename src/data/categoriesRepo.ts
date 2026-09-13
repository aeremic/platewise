import { and, asc, desc, eq, isNotNull, isNull, notInArray, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { DEFAULT_CATEGORIES } from '@/db/defaultCategories';
import { categories, entries, type Category } from '@/db/schema';
import type { HealthLevel } from '@/domain/health';

export type CategoryInput = {
  name: string;
  emoji: string | null;
  health: HealthLevel;
};

const byHealthThenName = [desc(categories.health), asc(categories.sortOrder), asc(categories.name)];

const notDeleted = isNull(categories.deletedAt);
const isActive = and(isNull(categories.archivedAt), notDeleted);

export function listActiveCategories(): Promise<Category[]> {
  return db.select().from(categories).where(isActive).orderBy(...byHealthThenName);
}

export function listArchivedCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(and(isNotNull(categories.archivedAt), notDeleted))
    .orderBy(...byHealthThenName);
}

/** Active categories ordered by when they were last logged, most recent first. */
export async function listRecentCategories(limit = 12): Promise<Category[]> {
  const rows = await db
    .select({ category: categories })
    .from(entries)
    .innerJoin(categories, eq(categories.id, entries.categoryId))
    .where(isActive)
    .groupBy(categories.id)
    // Entry ids are monotonic, so max(id) is the most recent use (created_at is only second-precise).
    .orderBy(desc(sql`max(${entries.id})`))
    .limit(limit);
  return rows.map((r) => r.category);
}

export async function getCategory(id: number): Promise<Category | undefined> {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0];
}

export async function createCategory(input: CategoryInput): Promise<number> {
  const [row] = await db
    .insert(categories)
    .values(normalize(input))
    .returning({ id: categories.id });
  return row.id;
}

export async function updateCategory(id: number, input: CategoryInput): Promise<void> {
  await db
    .update(categories)
    .set({ ...normalize(input), updatedAt: sql`(datetime('now'))` })
    .where(eq(categories.id, id));
}

export type RemoveResult = 'deleted' | 'archived';

/**
 * Built-in categories and categories with logged entries are archived so history
 * keeps resolving; unused custom categories are deleted outright.
 */
export async function removeCategory(id: number): Promise<RemoveResult> {
  const category = await getCategory(id);
  if (!category) return 'deleted';

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(entries)
    .where(eq(entries.categoryId, id));

  if (category.seedKey == null && count === 0) {
    await db.delete(categories).where(eq(categories.id, id));
    return 'deleted';
  }
  await db
    .update(categories)
    .set({ archivedAt: sql`(datetime('now'))`, updatedAt: sql`(datetime('now'))` })
    .where(eq(categories.id, id));
  return 'archived';
}

export async function restoreCategory(id: number): Promise<void> {
  await db
    .update(categories)
    .set({ archivedAt: null, updatedAt: sql`(datetime('now'))` })
    .where(eq(categories.id, id));
}

/** Inserts any built-in category that doesn't exist yet. Safe to run on every launch. */
export async function seedDefaultCategories(): Promise<void> {
  await db
    .insert(categories)
    .values(DEFAULT_CATEGORIES.map((c) => ({ ...c })))
    .onConflictDoNothing({ target: categories.seedKey });
}

/**
 * Resets the list to exactly the built-in categories: built-ins are un-archived and get their
 * original name, emoji and color; categories the user created are removed. A removed category
 * that was already logged is only marked deleted, so past days keep their color.
 */
export async function restoreDefaultCategories(): Promise<void> {
  const now = sql`(datetime('now'))`;
  // The expo-sqlite driver runs transactions synchronously.
  db.transaction((tx) => {
    for (const c of DEFAULT_CATEGORIES) {
      tx.update(categories)
        .set({ name: c.name, emoji: c.emoji, health: c.health, archivedAt: null, deletedAt: null, updatedAt: now })
        .where(eq(categories.seedKey, c.seedKey))
        .run();
    }

    const isCustom = isNull(categories.seedKey);
    const used = tx.selectDistinct({ id: entries.categoryId }).from(entries);
    tx.delete(categories).where(and(isCustom, notInArray(categories.id, used))).run();
    tx.update(categories)
      .set({ archivedAt: null, deletedAt: now, updatedAt: now })
      .where(and(isCustom, notDeleted))
      .run();
  });
  await seedDefaultCategories();
}

function normalize(input: CategoryInput): CategoryInput {
  const emoji = input.emoji?.trim();
  return { name: input.name.trim(), emoji: emoji ? emoji : null, health: input.health };
}
