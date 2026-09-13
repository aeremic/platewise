import { describe, expect, it } from '@jest/globals';

import { averageHealth, levelFromAverage, scoreDay } from '../health';

describe('levelFromAverage', () => {
  it('returns null when there is nothing to score', () => {
    expect(levelFromAverage(null)).toBeNull();
    expect(levelFromAverage(undefined)).toBeNull();
    expect(levelFromAverage(Number.NaN)).toBeNull();
  });

  it('applies the green / orange / red thresholds', () => {
    expect(levelFromAverage(2)).toBe(2);
    expect(levelFromAverage(1.5)).toBe(2);
    expect(levelFromAverage(1.49)).toBe(1);
    expect(levelFromAverage(0.75)).toBe(1);
    expect(levelFromAverage(0.74)).toBe(0);
    expect(levelFromAverage(0)).toBe(0);
  });
});

describe('scoreDay', () => {
  it('is null for an empty day', () => {
    expect(averageHealth([])).toBeNull();
    expect(scoreDay([])).toBeNull();
  });

  it('averages all entries', () => {
    expect(scoreDay([2, 2, 1])).toBe(2); // 1.67
    expect(scoreDay([2, 0])).toBe(1); // 1.0
    expect(scoreDay([2, 1, 0, 0])).toBe(1); // 0.75
    expect(scoreDay([1, 0, 0])).toBe(0); // 0.33
  });
});
