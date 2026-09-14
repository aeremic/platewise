import { asc, desc, lte } from 'drizzle-orm';

import { db } from '@/db/client';
import { dailyGoals } from '@/db/schema';
import { todayKey, type DateKey } from '@/domain/dates';
import { DEFAULT_GOALS, type Goals } from '@/domain/nutrition';

/** The goals that applied on `date` (latest change on or before it). */
export async function getGoalsForDate(date: DateKey): Promise<Goals> {
  const [row] = await db
    .select()
    .from(dailyGoals)
    .where(lte(dailyGoals.effectiveFrom, date))
    .orderBy(desc(dailyGoals.effectiveFrom))
    .limit(1);
  if (!row) return DEFAULT_GOALS;
  return { kcal: row.kcalMax, fiberG: row.fiberMin, sugarG: row.sugarMax };
}

export type GoalHistoryEntry = { effectiveFrom: DateKey; goals: Goals };

/** Every goal change, oldest first; use with `goalsOn` to judge many days at once. */
export async function listGoalHistory(): Promise<GoalHistoryEntry[]> {
  const rows = await db.select().from(dailyGoals).orderBy(asc(dailyGoals.effectiveFrom));
  return rows.map((row) => ({
    effectiveFrom: row.effectiveFrom,
    goals: { kcal: row.kcalMax, fiberG: row.fiberMin, sugarG: row.sugarMax },
  }));
}

/**
 * Saves goals starting today. Earlier days keep being judged by the goals they had;
 * saving again on the same day just replaces today's change.
 */
export async function saveGoals(goals: Goals): Promise<void> {
  const values = { kcalMax: goals.kcal, fiberMin: goals.fiberG, sugarMax: goals.sugarG };
  await db
    .insert(dailyGoals)
    .values({ effectiveFrom: todayKey(), ...values })
    .onConflictDoUpdate({ target: dailyGoals.effectiveFrom, set: values });
}
