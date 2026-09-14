import { describe, expect, it } from '@jest/globals';

import { explainRating, foodWeight, goalsOn, rateDay, type RatedFood } from '../dayRating';
import type { Goals } from '../nutrition';

const food = (name: string, health: 0 | 1 | 2, kcal: number | null, portions = 1, extra: Partial<RatedFood['nutrition']> = {}): RatedFood => ({
  name,
  health,
  portions,
  nutrition: { kcal, fiberG: 0, sugarG: 0, ...extra },
});

const noGoals: Goals = { kcal: null, fiberG: null, sugarG: null };

describe('foodWeight', () => {
  it('uses calories with a minimum per portion, and a default when unknown', () => {
    expect(foodWeight(food('Pizza', 0, 855, 1.5))).toBe(855);
    expect(foodWeight(food('Vegetables', 2, 60))).toBe(100);
    expect(foodWeight(food('Vegetables', 2, 120, 2))).toBe(200);
    expect(foodWeight(food('Kebab', 0, null))).toBe(200);
  });
});

describe('rateDay food quality', () => {
  it('is null for an empty day', () => {
    expect(rateDay([], noGoals)).toBeNull();
  });

  it('lets a big unhealthy portion outweigh several light healthy foods', () => {
    const day = [
      food('Salad', 2, 150),
      food('Fruit', 2, 95),
      food('Pizza', 0, 855, 1.5),
      food('Soda', 0, 140),
    ];
    // A plain average would be (2+2+0+0)/4 = 1.0 → orange.
    const rating = rateDay(day, noGoals)!;
    expect(rating.foodScore).toBeCloseTo(500 / 1245);
    expect(rating.foodLevel).toBe(0);
    expect(rating.level).toBe(0);
    expect(rating.shares[0]).toBeCloseTo(995 / 1245);
    expect(rating.worstFood?.name).toBe('Pizza');
  });

  it('counts a bigger portion of the same unhealthy food more', () => {
    const small = rateDay([food('Salad', 2, 300), food('Ice cream', 0, 210)], noGoals)!;
    const big = rateDay([food('Salad', 2, 300), food('Ice cream', 0, 630, 3)], noGoals)!;
    expect(big.foodScore).toBeLessThan(small.foodScore);
  });
});

describe('rateDay goal adjustments', () => {
  const goals: Goals = { kcal: 2000, fiberG: 30, sugarG: 50 };

  it('moves one step up when the fiber target is reached', () => {
    const rating = rateDay([food('Beans', 2, 500, 1, { fiberG: 20 }), food('Pasta', 1, 900, 1, { fiberG: 12 })], goals)!;
    expect(rating.foodLevel).toBe(1);
    expect(rating.level).toBe(2);
    expect(rating.adjustments).toEqual([{ kind: 'fiber-reached', total: 32, goal: 30 }]);
  });

  it('caps at orange when a limit is exceeded, even with the fiber bonus', () => {
    const rating = rateDay([food('Oatmeal', 2, 2200, 1, { fiberG: 35 })], goals)!;
    expect(rating.foodLevel).toBe(2);
    expect(rating.level).toBe(1);
    expect(rating.adjustments.map((a) => a.kind)).toEqual(['fiber-reached', 'over-limit']);
  });

  it('turns the day red when more than 25% over a limit', () => {
    const rating = rateDay([food('Fruit', 2, 400, 1, { sugarG: 71 })], goals)!;
    expect(rating.foodLevel).toBe(2);
    expect(rating.level).toBe(0);
    expect(rating.adjustments).toEqual([{ kind: 'over-limit', nutrient: 'sugarG', total: 71, goal: 50, severe: true }]);
  });

  it('ignores goals that are turned off', () => {
    const rating = rateDay([food('Fruit', 2, 400, 1, { sugarG: 200 })], { ...goals, sugarG: null })!;
    expect(rating.level).toBe(2);
    expect(rating.adjustments).toEqual([]);
  });
});

describe('explainRating', () => {
  it('describes the food mix, the heaviest culprit and each goal effect', () => {
    const rating = rateDay(
      [food('Salad', 2, 150, 1, { fiberG: 4 }), food('Pizza', 0, 855, 1.5, { sugarG: 12 }), food('Soda', 0, 140, 1, { sugarG: 59 })],
      { kcal: 2000, fiberG: 30, sugarG: 50 },
    )!;
    expect(explainRating(rating)).toEqual([
      { text: 'Mostly unhealthy food (87% unhealthy)', effect: 'neutral' },
      { text: 'Biggest unhealthy food: Pizza 1.5×', effect: 'neutral' },
      { text: 'Sugar far over limit (71 / 50 g): red day', effect: 'worse' },
    ]);
  });
});

describe('goalsOn', () => {
  const history = [
    { effectiveFrom: '0000-01-01', goals: { kcal: 2000, fiberG: 30, sugarG: 50 } },
    { effectiveFrom: '2026-09-14', goals: { kcal: 1800, fiberG: 30, sugarG: null } },
  ];

  it('picks the latest goals on or before the date', () => {
    expect(goalsOn(history, '2026-09-13')?.kcal).toBe(2000);
    expect(goalsOn(history, '2026-09-14')?.kcal).toBe(1800);
    expect(goalsOn([], '2026-09-14')).toBeNull();
  });
});
