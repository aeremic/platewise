import { asc, between, eq, sql } from 'drizzle-orm';

import { db } from '@/db/client';
import { categories, entries } from '@/db/schema';
import type { DateKey } from '@/domain/dates';
import { levelFromAverage, type HealthLevel } from '@/domain/health';
import { resolveEntryNutrition, type Nutrition } from '@/domain/nutrition';

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
  portionLabel: string | null;
  portions: number;
  /** The category's current values for one portion. */
  perPortion: Nutrition;
  /** What this entry counts for (snapshot, or category values × portions when not recorded). */
  nutrition: Nutrition;
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

const entryColumns = {
  id: entries.id,
  date: entries.date,
  categoryId: entries.categoryId,
  portions: entries.portions,
  entryKcal: entries.kcal,
  entryFiberG: entries.fiberG,
  entrySugarG: entries.sugarG,
  name: categories.name,
  emoji: categories.emoji,
  health: categories.health,
  portionLabel: categories.portionLabel,
  categoryKcal: categories.kcal,
  categoryFiberG: categories.fiberG,
  categorySugarG: categories.sugarG,
};

function selectEntries() {
  return db.select(entryColumns).from(entries).innerJoin(categories, eq(categories.id, entries.categoryId));
}

type EntryRow = Awaited<ReturnType<typeof selectEntries>>[number];

function toEntry(row: EntryRow): EntryWithCategory {
  const perPortion: Nutrition = { kcal: row.categoryKcal, fiberG: row.categoryFiberG, sugarG: row.categorySugarG };
  return {
    id: row.id,
    date: row.date,
    categoryId: row.categoryId,
    name: row.name,
    emoji: row.emoji,
    health: row.health,
    portionLabel: row.portionLabel,
    portions: row.portions,
    perPortion,
    nutrition: resolveEntryNutrition(
      { portions: row.portions, kcal: row.entryKcal, fiberG: row.entryFiberG, sugarG: row.entrySugarG },
      perPortion,
    ),
  };
}

export async function getEntriesForDate(date: DateKey): Promise<EntryWithCategory[]> {
  const rows = await selectEntries()
    .where(eq(entries.date, date))
    .orderBy(asc(entries.createdAt), asc(entries.id));
  return rows.map(toEntry);
}

export async function getEntry(id: number): Promise<EntryWithCategory | undefined> {
  const rows = await selectEntries().where(eq(entries.id, id)).limit(1);
  return rows[0] && toEntry(rows[0]);
}

/** Something about to be logged: values are totals for these portions and get snapshotted. */
export type EntryDraft = {
  categoryId: number;
  portions: number;
  nutrition: Nutrition;
};

export async function addEntries(date: DateKey, drafts: readonly EntryDraft[]): Promise<void> {
  if (drafts.length === 0) return;
  await db.insert(entries).values(
    drafts.map((d) => ({ date, categoryId: d.categoryId, portions: d.portions, ...d.nutrition })),
  );
}

export async function updateEntry(id: number, update: Pick<EntryDraft, 'portions' | 'nutrition'>): Promise<void> {
  await db
    .update(entries)
    .set({ portions: update.portions, ...update.nutrition })
    .where(eq(entries.id, id));
}

export async function deleteEntry(id: number): Promise<void> {
  await db.delete(entries).where(eq(entries.id, id));
}
