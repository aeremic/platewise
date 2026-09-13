import { asc, desc, eq, isNotNull, isNull, sql } from 'drizzle-orm';

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

export function listActiveCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(isNull(categories.archivedAt))
    .orderBy(...byHealthThenName);
}

export function listArchivedCategories(): Promise<Category[]> {
  return db
    .select()
    .from(categories)
    .where(isNotNull(categories.archivedAt))
    .orderBy(...byHealthThenName);
}

export async function getCategory(id: number): Promise<Category | undefined> {
  const rows = await db.select().from(categories).where(eq(categories.id, id)).limit(1);
  return rows[0];
}

export async function createCategory(input: CategoryInput): Promise<void> {
  await db.insert(categories).values(normalize(input));
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

/** Un-archives built-ins and resets their name, emoji and color. Custom categories are untouched. */
export async function restoreDefaultCategories(): Promise<void> {
  // The expo-sqlite driver runs transactions synchronously.
  db.transaction((tx) => {
    for (const c of DEFAULT_CATEGORIES) {
      tx.update(categories)
        .set({
          name: c.name,
          emoji: c.emoji,
          health: c.health,
          archivedAt: null,
          updatedAt: sql`(datetime('now'))`,
        })
        .where(eq(categories.seedKey, c.seedKey))
        .run();
    }
  });
  await seedDefaultCategories();
}

function normalize(input: CategoryInput): CategoryInput {
  const emoji = input.emoji?.trim();
  return { name: input.name.trim(), emoji: emoji ? emoji : null, health: input.health };
}
