import { asc, between, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { categories, entries } from '@/db/schema';
import type { DateKey } from '@/domain/dates';
import { levelFromAverage, type HealthLevel } from '@/domain/health';

export type DaySummary = {
  date: DateKey;
  count: number;
  average: number;
  level: HealthLevel;
};

export type EntryWithCategory = {
  id: number;
  date: DateKey;
  categoryId: number;
  name: string;
  emoji: string | null;
  health: HealthLevel;
};

/**
 * One row per day that has entries. Health comes from the category's current color,
 * so recoloring a category also recolors past days.
 */
export async function getDaySummaries(from: DateKey, to: DateKey): Promise<Map<DateKey, DaySummary>> {
  const rows = await db
    .select({
      date: entries.date,
      count: sql<number>`count(*)`,
      average: sql<number>`avg(${categories.health})`,
    })
    .from(entries)
    .innerJoin(categories, eq(categories.id, entries.categoryId))
    .where(between(entries.date, from, to))
    .groupBy(entries.date);

  const byDate = new Map<DateKey, DaySummary>();
  for (const row of rows) {
    const level = levelFromAverage(row.average);
    if (level != null) byDate.set(row.date, { ...row, level });
  }
  return byDate;
}

export function getEntriesForDate(date: DateKey): Promise<EntryWithCategory[]> {
  return db
    .select({
      id: entries.id,
      date: entries.date,
      categoryId: entries.categoryId,
      name: categories.name,
      emoji: categories.emoji,
      health: categories.health,
    })
    .from(entries)
    .innerJoin(categories, eq(categories.id, entries.categoryId))
    .where(eq(entries.date, date))
    .orderBy(asc(entries.createdAt), asc(entries.id));
}

export async function addEntries(date: DateKey, categoryIds: readonly number[]): Promise<void> {
  if (categoryIds.length === 0) return;
  await db.insert(entries).values(categoryIds.map((categoryId) => ({ date, categoryId })));
}

export async function deleteEntry(id: number): Promise<void> {
  await db.delete(entries).where(eq(entries.id, id));
}
