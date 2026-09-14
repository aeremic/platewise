import { StyleSheet, Text, View } from 'react-native';

import { HealthDot } from '@/components/CategoryChip';
import { GoalProgress } from '@/components/nutrition/GoalProgress';
import type { DayRating } from '@/domain/dayRating';
import { HEALTH_LABELS } from '@/domain/health';
import type { Goals } from '@/domain/nutrition';
import { colors, healthColor, spacing, type, withAlpha } from '@/theme';

import { RatingExplanation } from './RatingExplanation';

type Props = {
  rating: DayRating;
  goals: Goals;
  /** Unsaved changes included in this preview; nothing is stored until the user saves. */
  unsavedLabel?: string | null;
};

/** The day's color, why it got it, and goal progress — including unsaved changes when given. */
export function DayPreview({ rating, goals, unsavedLabel }: Props) {
  const color = healthColor(rating.level);
  return (
    <View
      style={[
        styles.card,
        unsavedLabel ? { borderColor: withAlpha(colors.accent, 0.5), borderStyle: 'dashed' } : null,
      ]}>
      <View style={styles.header}>
        <Text style={styles.title}>Your day</Text>
        <View style={[styles.levelPill, { borderColor: color }]}>
          <HealthDot level={rating.level} />
          <Text style={styles.levelText}>{HEALTH_LABELS[rating.level]}</Text>
        </View>
      </View>
      {unsavedLabel ? (
        <Text style={styles.unsaved} accessibilityLiveRegion="polite">
          Preview · {unsavedLabel}
        </Text>
      ) : null}
      <RatingExplanation rating={rating} />
      <GoalProgress totals={rating.totals} goals={goals} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.glassFill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...type.headline,
    color: colors.text,
  },
  levelPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  levelText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  unsaved: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
    marginTop: -spacing.sm,
  },
});
