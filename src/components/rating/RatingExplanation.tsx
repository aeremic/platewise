import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { explainRating, type DayRating } from '@/domain/dayRating';
import { HEALTH_LABELS, HEALTH_LEVELS } from '@/domain/health';
import { colors, healthColor, spacing } from '@/theme';

type Props = {
  rating: DayRating;
  /** Compact: a single line with the most important reasons (home Today card). */
  compact?: boolean;
};

/** Why a day got its color: the food mix and each goal adjustment. */
export function RatingExplanation({ rating, compact = false }: Props) {
  const reasons = explainRating(rating);

  if (compact) {
    // Goal effects matter most when they changed the color; otherwise show the food summary.
    const goalReasons = reasons.filter((r) => r.effect !== 'neutral');
    const line = (goalReasons.length > 0 ? goalReasons : reasons.slice(0, 1)).map((r) => r.text).join(' · ');
    return (
      <View style={styles.compact}>
        <FoodMixBar rating={rating} />
        <Text style={styles.compactText} numberOfLines={2}>
          {line}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FoodMixBar rating={rating} />
      {reasons.map((reason) => (
        <View key={reason.text} style={styles.reason}>
          <Icon
            ios={reason.effect === 'better' ? 'arrow.up.circle.fill' : reason.effect === 'worse' ? 'arrow.down.circle.fill' : 'circle.fill'}
            android={reason.effect === 'better' ? 'arrow_circle_up' : reason.effect === 'worse' ? 'arrow_circle_down' : 'circle'}
            size={reason.effect === 'neutral' ? 6 : 13}
            color={
              reason.effect === 'better'
                ? colors.health[2]
                : reason.effect === 'worse'
                  ? colors.health[0]
                  : colors.textTertiary
            }
          />
          <Text style={styles.reasonText}>{reason.text}</Text>
        </View>
      ))}
    </View>
  );
}

/** Share of what was eaten (weighted by amount) that was healthy / moderate / unhealthy. */
function FoodMixBar({ rating }: { rating: DayRating }) {
  const label = HEALTH_LEVELS.map((level) => `${Math.round(rating.shares[level] * 100)}% ${HEALTH_LABELS[level].toLowerCase()}`).join(', ');
  return (
    <View style={styles.bar} accessible accessibilityLabel={`Food mix: ${label}`}>
      {HEALTH_LEVELS.map((level) =>
        rating.shares[level] > 0 ? (
          <View key={level} style={{ flex: rating.shares[level], backgroundColor: healthColor(level) }} />
        ) : null,
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  compact: {
    gap: 6,
  },
  bar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    gap: 2,
    marginBottom: 2,
  },
  reason: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  reasonText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
  compactText: {
    color: colors.textSecondary,
    fontSize: 12,
  },
});
