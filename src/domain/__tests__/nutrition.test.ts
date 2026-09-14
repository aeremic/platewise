import { describe, expect, it } from '@jest/globals';

import {
  clampPortions,
  evaluateGoal,
  formatAmount,
  parseAmount,
  resolveEntryNutrition,
  scaleNutrition,
  sumNutrition,
} from '../nutrition';

describe('portions', () => {
  it('snaps to half portions within bounds', () => {
    expect(clampPortions(1.3)).toBe(1.5);
    expect(clampPortions(0)).toBe(0.5);
    expect(clampPortions(99)).toBe(20);
  });

  it('scales every known value and keeps unknown ones unknown', () => {
    expect(scaleNutrition({ kcal: 570, fiberG: 4, sugarG: null }, 1.5)).toEqual({
      kcal: 855,
      fiberG: 6,
      sugarG: null,
    });
  });
});

describe('resolveEntryNutrition', () => {
  const pizza = { kcal: 570, fiberG: 4, sugarG: 8 };

  it('prefers values stored on the entry', () => {
    expect(resolveEntryNutrition({ portions: 1, kcal: 900, fiberG: 5, sugarG: 10 }, pizza)).toEqual({
      kcal: 900,
      fiberG: 5,
      sugarG: 10,
    });
  });

  it('falls back to category values × portions per nutrient', () => {
    expect(resolveEntryNutrition({ portions: 2, kcal: 1000, fiberG: null, sugarG: null }, pizza)).toEqual({
      kcal: 1000,
      fiberG: 8,
      sugarG: 16,
    });
  });
});

describe('sumNutrition', () => {
  it('adds known values and counts missing ones', () => {
    const result = sumNutrition([
      { kcal: 160, fiberG: 2, sugarG: 3 },
      { kcal: 570, fiberG: null, sugarG: 8.25 },
    ]);
    expect(result.totals).toEqual({ kcal: 730, fiberG: 2, sugarG: 11.3 });
    expect(result.missing).toEqual({ kcal: 0, fiberG: 1, sugarG: 0 });
  });
});

describe('evaluateGoal', () => {
  it('treats calories and sugar as limits', () => {
    expect(evaluateGoal('kcal', 1800, 2000)).toMatchObject({ met: true, progress: 0.9 });
    expect(evaluateGoal('sugarG', 60, 50)).toMatchObject({ met: false, progress: 1.2 });
  });

  it('treats fiber as a target to reach', () => {
    expect(evaluateGoal('fiberG', 12, 30)).toMatchObject({ met: false, progress: 0.4 });
    expect(evaluateGoal('fiberG', 30, 30)).toMatchObject({ met: true });
  });

  it('reports nothing for a goal that is off', () => {
    expect(evaluateGoal('kcal', 1800, null)).toMatchObject({ goal: null, progress: null, met: null });
  });
});

describe('formatting and parsing', () => {
  it('formats kcal as whole numbers and grams with one decimal', () => {
    expect(formatAmount('kcal', 1234.6)).toBe('1,235');
    expect(formatAmount('fiberG', 2.25)).toBe('2.3');
    expect(formatAmount('sugarG', null)).toBe('–');
  });

  it('parses decimal input with dot or comma', () => {
    expect(parseAmount('12,5')).toBe(12.5);
    expect(parseAmount(' 7 ')).toBe(7);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('abc')).toBeUndefined();
  });
});
