import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { DaySummary } from '@/data/entriesRepo';
import { monthGrid, todayKey, weekdayLabels, type CalendarDay, type DateKey } from '@/domain/dates';
import { HEALTH_LABELS } from '@/domain/health';
import { colors, healthColor, withAlpha } from '@/theme';

type Props = {
  month: Date;
  summaries?: Map<DateKey, DaySummary>;
  /** Highlights one day (used by the date picker). */
  selectedKey?: DateKey;
  onSelectDay: (key: DateKey) => void;
  compact?: boolean;
};

export function MonthGrid({ month, summaries, selectedKey, onSelectDay, compact = false }: Props) {
  const weeks = monthGrid(month);
  const today = todayKey();

  return (
    <View>
      <View style={styles.row}>
        {weekdayLabels().map((label, i) => (
          <Text key={i} style={styles.weekday}>
            {label}
          </Text>
        ))}
      </View>
      {weeks.map((week) => (
        <View key={week[0].key} style={styles.row}>
          {week.map((day) => (
            <DayCell
              key={day.key}
              day={day}
              summary={summaries?.get(day.key)}
              isToday={day.key === today}
              isSelected={day.key === selectedKey}
              compact={compact}
              onSelectDay={onSelectDay}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

type DayCellProps = {
  day: CalendarDay;
  summary?: DaySummary;
  isToday: boolean;
  isSelected: boolean;
  compact: boolean;
  onSelectDay: (key: DateKey) => void;
};

const DayCell = memo(function DayCell({
  day,
  summary,
  isToday,
  isSelected,
  compact,
  onSelectDay,
}: DayCellProps) {
  const size = compact ? 34 : 42;
  const color = summary ? healthColor(summary.level) : undefined;

  const label = [
    day.key,
    isToday ? 'today' : null,
    summary ? `${HEALTH_LABELS[summary.level]}, ${summary.count} logged` : 'nothing logged',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: isSelected }}
      onPress={() => onSelectDay(day.key)}
      style={({ pressed }) => [
        styles.cell,
        { opacity: day.inMonth ? 1 : 0.28, transform: [{ scale: pressed ? 0.9 : 1 }] },
      ]}>
      <View
        style={[
          styles.dot,
          { width: size, height: size, borderRadius: size / 2 },
          color && {
            backgroundColor: withAlpha(color, 0.3),
            borderColor: withAlpha(color, 0.95),
            boxShadow: `0 0 ${compact ? 8 : 14}px ${withAlpha(color, 0.55)}`,
          },
          isToday && !color && styles.todayRing,
          isSelected && styles.selected,
        ]}>
        <Text
          style={[
            styles.dayText,
            compact && styles.dayTextCompact,
            isToday && styles.todayText,
            isSelected && styles.selectedText,
          ]}>
          {day.dayOfMonth}
        </Text>
      </View>
      {isToday && color && !isSelected ? <View style={styles.todayMarker} /> : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  weekday: {
    flex: 1,
    textAlign: 'center',
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    paddingBottom: 8,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  dot: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  todayRing: {
    borderColor: colors.text,
  },
  selected: {
    backgroundColor: colors.text,
    borderColor: colors.text,
  },
  dayText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  dayTextCompact: {
    fontSize: 14,
  },
  todayText: {
    fontWeight: '800',
  },
  selectedText: {
    color: colors.background,
    fontWeight: '700',
  },
  todayMarker: {
    position: 'absolute',
    bottom: 0,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.text,
  },
});
