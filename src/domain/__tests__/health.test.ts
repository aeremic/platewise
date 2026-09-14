import { describe, expect, it } from '@jest/globals';

import { levelFromAverage } from '../health';

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
