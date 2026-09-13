import { addMonths, format, isSameMonth, startOfMonth } from 'date-fns';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeInLeft, FadeInRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/AmbientBackground';
import { MonthGrid } from '@/components/calendar/MonthGrid';
import { HealthDot } from '@/components/CategoryChip';
import { Glass } from '@/components/glass/Glass';
import { GlassButton, IconButton } from '@/components/glass/GlassButton';
import { Icon } from '@/components/Icon';
import { getDaySummaries, getEntriesForDate } from '@/data/entriesRepo';
import { gridRange, todayKey, type DateKey } from '@/domain/dates';
import { HEALTH_LABELS, HEALTH_LEVELS, scoreDay } from '@/domain/health';
import { useLiveData } from '@/hooks/useLiveData';
import { haptics } from '@/lib/haptics';
import { colors, healthColor, spacing, type } from '@/theme';

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [direction, setDirection] = useState<1 | -1>(1);

  const { from, to } = gridRange(month);
  const { data: summaries } = useLiveData(
    () => getDaySummaries(from, to),
    ['entries', 'categories'],
    `${from}:${to}`,
  );

  const today = todayKey();
  const { data: todayEntries = [] } = useLiveData(
    () => getEntriesForDate(today),
    ['entries', 'categories'],
    today,
  );
  const todayLevel = scoreDay(todayEntries.map((e) => e.health));

  const showMonth = (delta: 1 | -1) => {
    haptics.tap();
    setDirection(delta);
    setMonth((m) => addMonths(m, delta));
  };
  const goToCurrentMonth = () => {
    haptics.tap();
    const current = startOfMonth(new Date());
    setDirection(current > month ? 1 : -1);
    setMonth(current);
  };
  const openDay = (date?: DateKey) => {
    router.push(date ? { pathname: '/day', params: { date } } : '/day');
  };

  const swipe = Gesture.Race(
    Gesture.Fling()
      .direction(Directions.LEFT)
      .runOnJS(true)
      .onEnd(() => showMonth(1)),
    Gesture.Fling()
      .direction(Directions.RIGHT)
      .runOnJS(true)
      .onEnd(() => showMonth(-1)),
  );

  const isCurrentMonth = isSameMonth(month, new Date());
  const monthKey = format(month, 'yyyy-MM');

  return (
    <View style={styles.screen}>
      <AmbientBackground />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + spacing.sm,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: spacing.lg,
          gap: spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.brand}>Platewise</Text>
          <IconButton accessibilityLabel="Edit categories" onPress={() => router.push('/categories')}>
            <Icon ios="slider.horizontal.3" android="tune" />
          </IconButton>
        </View>

        <GestureDetector gesture={swipe}>
          <Glass radius={32} style={styles.calendarCard}>
            <View style={styles.monthRow}>
              <Animated.View key={monthKey} entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(220)}>
                <Text style={styles.monthTitle}>
                  {format(month, 'MMMM')} <Text style={styles.yearTitle}>{format(month, 'yyyy')}</Text>
                </Text>
              </Animated.View>
              <View style={styles.monthControls}>
                {!isCurrentMonth && (
                  <GlassButton
                    accessibilityLabel="Go to current month"
                    onPress={goToCurrentMonth}
                    contentStyle={styles.todayPill}>
                    <Text style={styles.todayPillText}>Today</Text>
                  </GlassButton>
                )}
                <IconButton size={36} accessibilityLabel="Previous month" onPress={() => showMonth(-1)}>
                  <Icon ios="chevron.left" android="chevron_left" size={16} />
                </IconButton>
                <IconButton size={36} accessibilityLabel="Next month" onPress={() => showMonth(1)}>
                  <Icon ios="chevron.right" android="chevron_right" size={16} />
                </IconButton>
              </View>
            </View>

            <Animated.View key={monthKey} entering={(direction > 0 ? FadeInRight : FadeInLeft).duration(220)}>
              <MonthGrid month={month} summaries={summaries} onSelectDay={openDay} />
            </Animated.View>

            <View style={styles.legend}>
              {HEALTH_LEVELS.map((level) => (
                <View key={level} style={styles.legendItem}>
                  <HealthDot level={level} />
                  <Text style={styles.legendText}>{HEALTH_LABELS[level]}</Text>
                </View>
              ))}
            </View>
          </Glass>
        </GestureDetector>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open today"
          onPress={() => openDay(today)}
          style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.98 : 1 }] })}>
          <Glass radius={28} style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <View>
                <Text style={styles.overline}>Today</Text>
                <Text style={styles.todayDate}>{format(new Date(), 'EEEE, MMMM d')}</Text>
              </View>
              {todayLevel != null ? (
                <View style={[styles.levelPill, { borderColor: healthColor(todayLevel) }]}>
                  <HealthDot level={todayLevel} />
                  <Text style={styles.levelPillText}>{HEALTH_LABELS[todayLevel]}</Text>
                </View>
              ) : null}
            </View>
            {todayEntries.length > 0 ? (
              <Text style={styles.todayEmoji} numberOfLines={2}>
                {todayEntries.map((e) => e.emoji ?? '•').join('  ')}
              </Text>
            ) : (
              <Text style={styles.todayEmpty}>Nothing logged yet. What did you eat today?</Text>
            )}
          </Glass>
        </Pressable>
      </ScrollView>

      <View pointerEvents="box-none" style={[styles.fabWrap, { bottom: insets.bottom + spacing.lg }]}>
        <GlassButton
          accessibilityLabel="Add food for today"
          onPress={() => openDay()}
          tint={colors.accent}
          contentStyle={styles.fab}>
          <Icon ios="plus" android="add" size={20} />
          <Text style={styles.fabText}>Add food</Text>
        </GlassButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brand: {
    ...type.title,
    color: colors.text,
  },
  calendarCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  monthTitle: {
    ...type.title,
    color: colors.text,
  },
  yearTitle: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  monthControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  todayPill: {
    height: 36,
    paddingHorizontal: spacing.md,
  },
  todayPillText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingTop: spacing.xs,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  todayCard: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overline: {
    ...type.overline,
    color: colors.textTertiary,
  },
  todayDate: {
    ...type.headline,
    color: colors.text,
    marginTop: 2,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  levelPillText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  todayEmoji: {
    fontSize: 24,
    lineHeight: 34,
  },
  todayEmpty: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    height: 60,
    paddingHorizontal: 28,
    gap: spacing.sm,
  },
  fabText: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '600',
  },
});
