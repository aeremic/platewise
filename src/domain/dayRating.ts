import { HEALTH_LABELS, levelFromAverage, type HealthLevel } from './health';
import {
  formatAmount,
  formatPortions,
  NUTRIENT_INFO,
  sumNutrition,
  type Goals,
  type Nutrition,
  type NutritionTotals,
} from './nutrition';

/**
 * How healthy a day was.
 *
 * 1. Food quality: average of the foods' health levels (0 red … 2 green), weighted by how much
 *    was eaten — calories, but at least MIN_KCAL_PER_PORTION per portion so light healthy food
 *    (vegetables) still counts, and DEFAULT_KCAL_PER_PORTION when calories are unknown.
 * 2. Goals adjust that level, in this order:
 *    - fiber target reached → one step better;
 *    - over the calorie or sugar limit → can't be green;
 *    - more than SEVERE_OVER over a limit → red.
 *    Limits come last so a big overshoot can't be offset by fiber.
 *
 * Everything is computed from current data, so rule or category changes recolor past days.
 */

export const MIN_KCAL_PER_PORTION = 100;
export const DEFAULT_KCAL_PER_PORTION = 200;
/** 25% over a limit turns the day red. */
export const SEVERE_OVER = 1.25;

export type RatedFood = {
  name: string;
  health: HealthLevel;
  portions: number;
  nutrition: Nutrition;
};

export type GoalAdjustment =
  | { kind: 'fiber-reached'; total: number; goal: number }
  | { kind: 'over-limit'; nutrient: 'kcal' | 'sugarG'; total: number; goal: number; severe: boolean };

export type DayRating = {
  /** Final color, after goal adjustments. */
  level: HealthLevel;
  /** Color from food quality alone. */
  foodLevel: HealthLevel;
  /** Weighted average health, 0–2. */
  foodScore: number;
  /** Share (0–1) of what was eaten at each health level. */
  shares: Record<HealthLevel, number>;
  /** The least healthy food, heaviest first among equals; null if everything was green. */
  worstFood: RatedFood | null;
  adjustments: GoalAdjustment[];
  totals: NutritionTotals;
};

export function foodWeight(food: Pick<RatedFood, 'portions' | 'nutrition'>): number {
  const kcal = food.nutrition.kcal ?? DEFAULT_KCAL_PER_PORTION * food.portions;
  return Math.max(kcal, MIN_KCAL_PER_PORTION * food.portions);
}

export function rateDay(foods: readonly RatedFood[], goals: Goals | null): DayRating | null {
  if (foods.length === 0) return null;

  const weights = foods.map(foodWeight);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const weighted = foods.reduce((sum, food, i) => sum + food.health * weights[i], 0);
  const foodScore = weighted / totalWeight;
  const foodLevel = levelFromAverage(foodScore) ?? 0;

  const shares: Record<HealthLevel, number> = { 0: 0, 1: 0, 2: 0 };
  foods.forEach((food, i) => (shares[food.health] += weights[i] / totalWeight));

  let worstFood: RatedFood | null = null;
  let worstKey = -Infinity;
  foods.forEach((food, i) => {
    if (food.health === 2) return;
    // Redder first, then heavier.
    const key = (2 - food.health) * 1e9 + weights[i];
    if (key > worstKey) {
      worstKey = key;
      worstFood = food;
    }
  });

  const totals = sumNutrition(foods.map((f) => f.nutrition));
  const adjustments: GoalAdjustment[] = [];
  let level = foodLevel;

  if (goals?.fiberG != null && goals.fiberG > 0 && totals.totals.fiberG >= goals.fiberG) {
    adjustments.push({ kind: 'fiber-reached', total: totals.totals.fiberG, goal: goals.fiberG });
    level = Math.min(2, level + 1) as HealthLevel;
  }
  for (const nutrient of ['kcal', 'sugarG'] as const) {
    const goal = goals?.[nutrient];
    const total = totals.totals[nutrient];
    if (goal == null || goal <= 0 || total <= goal) continue;
    const severe = total > goal * SEVERE_OVER;
    adjustments.push({ kind: 'over-limit', nutrient, total, goal, severe });
    level = severe ? 0 : (Math.min(level, 1) as HealthLevel);
  }

  return { level, foodLevel, foodScore, shares, worstFood, adjustments, totals };
}

export type RatingReason = {
  text: string;
  /** Whether this reason made the day better, worse, or just describes it. */
  effect: 'better' | 'worse' | 'neutral';
};

export function explainRating(rating: DayRating): RatingReason[] {
  const pct = (share: number) => Math.round(share * 100);
  const reasons: RatingReason[] = [];

  const food =
    rating.foodLevel === 2
      ? `Mostly healthy food (${pct(rating.shares[2])}% healthy)`
      : rating.foodLevel === 1
        ? `Mixed food (${pct(rating.shares[2])}% healthy, ${pct(rating.shares[0])}% unhealthy)`
        : `Mostly unhealthy food (${pct(rating.shares[0])}% unhealthy)`;
  reasons.push({ text: food, effect: 'neutral' });

  if (rating.worstFood && rating.foodLevel < 2) {
    const { name, portions, health } = rating.worstFood;
    const amount = portions !== 1 ? ` ${formatPortions(portions)}×` : '';
    reasons.push({
      text: `Biggest ${HEALTH_LABELS[health].toLowerCase()} food: ${name}${amount}`,
      effect: 'neutral',
    });
  }

  for (const adjustment of rating.adjustments) {
    if (adjustment.kind === 'fiber-reached') {
      reasons.push({
        text: `Fiber goal reached (${formatAmount('fiberG', adjustment.total)} / ${formatAmount('fiberG', adjustment.goal)} g): one step better`,
        effect: 'better',
      });
      continue;
    }
    const { label, unit } = NUTRIENT_INFO[adjustment.nutrient];
    const values = `${formatAmount(adjustment.nutrient, adjustment.total)} / ${formatAmount(adjustment.nutrient, adjustment.goal)} ${unit}`;
    reasons.push({
      text: adjustment.severe
        ? `${label} far over limit (${values}): red day`
        : `${label} over limit (${values}): can’t be green`,
      effect: 'worse',
    });
  }
  return reasons;
}

/** Goals in effect on `date`, from a history sorted by `effectiveFrom` ascending. */
export function goalsOn<T extends { effectiveFrom: string; goals: Goals }>(history: readonly T[], date: string): Goals | null {
  let current: Goals | null = null;
  for (const entry of history) {
    if (entry.effectiveFrom > date) break;
    current = entry.goals;
  }
  return current;
}
