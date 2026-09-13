import {
  addDays,
  format,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
} from 'date-fns';

/** Weeks start on Monday. */
export const WEEK_STARTS_ON = 1;

/** A local calendar day formatted as 'YYYY-MM-DD'. */
export type DateKey = string;

export function toDateKey(date: Date): DateKey {
  return format(date, 'yyyy-MM-dd');
}

export function fromDateKey(key: DateKey): Date {
  return parse(key, 'yyyy-MM-dd', new Date());
}

export function todayKey(): DateKey {
  return toDateKey(new Date());
}

export function isDateKey(value: unknown): value is DateKey {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export type CalendarDay = {
  key: DateKey;
  dayOfMonth: number;
  inMonth: boolean;
};

/** Always 6 rows × 7 days so the grid height never jumps between months. */
export function monthGrid(month: Date): CalendarDay[][] {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
  const weeks: CalendarDay[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: CalendarDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(start, w * 7 + d);
      week.push({ key: toDateKey(date), dayOfMonth: date.getDate(), inMonth: isSameMonth(date, month) });
    }
    weeks.push(week);
  }
  return weeks;
}

/** Range covering every cell of the 6-week grid, including adjacent-month days. */
export function gridRange(month: Date): { from: DateKey; to: DateKey } {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: WEEK_STARTS_ON });
  return { from: toDateKey(start), to: toDateKey(addDays(start, 41)) };
}

export function weekdayLabels(): string[] {
  const start = startOfWeek(new Date(), { weekStartsOn: WEEK_STARTS_ON });
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), 'EEEEE'));
}
