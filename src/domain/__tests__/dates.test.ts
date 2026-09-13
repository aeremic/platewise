import { describe, expect, it } from '@jest/globals';

import { fromDateKey, gridRange, isDateKey, monthGrid, toDateKey } from '../dates';

describe('date keys', () => {
  it('round-trips local calendar days', () => {
    const date = new Date(2026, 8, 13, 23, 59);
    expect(toDateKey(date)).toBe('2026-09-13');
    expect(toDateKey(fromDateKey('2026-09-13'))).toBe('2026-09-13');
  });

  it('validates the key format', () => {
    expect(isDateKey('2026-09-13')).toBe(true);
    expect(isDateKey('2026-9-13')).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
  });
});

describe('monthGrid', () => {
  const september2026 = new Date(2026, 8, 1);

  it('always has 6 weeks of 7 days starting on Monday', () => {
    const weeks = monthGrid(september2026);
    expect(weeks).toHaveLength(6);
    weeks.forEach((week) => expect(week).toHaveLength(7));
    // Sept 1, 2026 is a Tuesday, so the grid starts on Monday Aug 31.
    expect(weeks[0][0]).toEqual({ key: '2026-08-31', dayOfMonth: 31, inMonth: false });
    expect(weeks[0][1]).toEqual({ key: '2026-09-01', dayOfMonth: 1, inMonth: true });
  });

  it('covers exactly the visible cells', () => {
    const weeks = monthGrid(september2026);
    expect(gridRange(september2026)).toEqual({ from: weeks[0][0].key, to: weeks[5][6].key });
  });
});
