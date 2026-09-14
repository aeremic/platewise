/** Amounts for one portion of a category, or the total of one logged entry. `null` = unknown. */
export type Nutrition = {
  kcal: number | null;
  fiberG: number | null;
  sugarG: number | null;
};

export const NUTRIENTS = ['kcal', 'fiberG', 'sugarG'] as const;
export type NutrientKey = (typeof NUTRIENTS)[number];

/** `max` = stay at or under the goal, `min` = reach at least the goal. */
export type GoalKind = 'max' | 'min';

export const NUTRIENT_INFO: Record<NutrientKey, { label: string; unit: string; goalKind: GoalKind }> = {
  kcal: { label: 'Calories', unit: 'kcal', goalKind: 'max' },
  fiberG: { label: 'Fiber', unit: 'g', goalKind: 'min' },
  sugarG: { label: 'Sugar', unit: 'g', goalKind: 'max' },
};

/** Daily goals; `null` = goal turned off. */
export type Goals = Record<NutrientKey, number | null>;

export const DEFAULT_GOALS: Goals = { kcal: 2000, fiberG: 30, sugarG: 50 };

export const EMPTY_NUTRITION: Nutrition = { kcal: null, fiberG: null, sugarG: null };

export const PORTION_STEP = 0.5;
export const MIN_PORTIONS = 0.5;
export const MAX_PORTIONS = 20;

export function clampPortions(portions: number): number {
  const stepped = Math.round(portions / PORTION_STEP) * PORTION_STEP;
  return Math.min(MAX_PORTIONS, Math.max(MIN_PORTIONS, stepped));
}

export function scaleNutrition(nutrition: Nutrition, factor: number): Nutrition {
  const scale = (v: number | null) => (v == null ? null : roundAmount(v * factor));
  return { kcal: scale(nutrition.kcal), fiberG: scale(nutrition.fiberG), sugarG: scale(nutrition.sugarG) };
}

/**
 * What one logged entry counts for. Values stored on the entry win (they were snapshotted when
 * logging, so later category edits don't change past days); entries logged before nutrition
 * existed, or with unknown values, fall back to the category's per-portion values × portions.
 */
export function resolveEntryNutrition(entry: Nutrition & { portions: number }, category: Nutrition): Nutrition {
  const fallback = scaleNutrition(category, entry.portions);
  return {
    kcal: entry.kcal ?? fallback.kcal,
    fiberG: entry.fiberG ?? fallback.fiberG,
    sugarG: entry.sugarG ?? fallback.sugarG,
  };
}

export type NutritionTotals = {
  totals: Record<NutrientKey, number>;
  /** How many entries had no value for each nutrient (so the total is a lower bound). */
  missing: Record<NutrientKey, number>;
};

export function sumNutrition(items: readonly Nutrition[]): NutritionTotals {
  const totals = { kcal: 0, fiberG: 0, sugarG: 0 };
  const missing = { kcal: 0, fiberG: 0, sugarG: 0 };
  for (const item of items) {
    for (const key of NUTRIENTS) {
      const value = item[key];
      if (value == null) missing[key] += 1;
      else totals[key] += value;
    }
  }
  for (const key of NUTRIENTS) totals[key] = roundAmount(totals[key]);
  return { totals, missing };
}

export type GoalStatus = {
  kind: GoalKind;
  total: number;
  goal: number | null;
  /** total / goal, uncapped; null when the goal is off. */
  progress: number | null;
  /** max: still at or under the limit; min: target reached. null when the goal is off. */
  met: boolean | null;
};

export function evaluateGoal(key: NutrientKey, total: number, goal: number | null): GoalStatus {
  const kind = NUTRIENT_INFO[key].goalKind;
  if (goal == null || goal <= 0) return { kind, total, goal: null, progress: null, met: null };
  return { kind, total, goal, progress: total / goal, met: kind === 'max' ? total <= goal : total >= goal };
}

/** kcal as whole numbers, grams with at most one decimal. */
export function roundAmount(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatAmount(key: NutrientKey, value: number | null): string {
  if (value == null) return '–';
  if (key === 'kcal') return Math.round(value).toLocaleString('en-US');
  return String(roundAmount(value));
}

export function formatPortions(portions: number): string {
  return String(roundAmount(portions));
}

/** Parses user input like "12", "12.5" or "12,5". Empty input = unknown (null). */
export function parseAmount(text: string): number | null | undefined {
  const trimmed = text.trim().replace(',', '.');
  if (trimmed === '') return null;
  if (!/^\d*\.?\d*$/.test(trimmed) || trimmed === '.') return undefined; // invalid
  return roundAmount(Number(trimmed));
}
