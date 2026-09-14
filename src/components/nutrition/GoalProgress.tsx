import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import {
  evaluateGoal,
  formatAmount,
  NUTRIENT_INFO,
  NUTRIENTS,
  type GoalStatus,
  type Goals,
  type NutritionTotals,
} from '@/domain/nutrition';
import { colors, spacing, withAlpha } from '@/theme';

type Props = {
  totals: NutritionTotals;
  goals: Goals;
};

/** Today's kcal / fiber / sugar against the daily goals. */
export function GoalProgress({ totals, goals }: Props) {
  const missing = Math.max(...NUTRIENTS.map((key) => totals.missing[key]));

  return (
    <View style={styles.container}>
      <View style={styles.columns}>
        {NUTRIENTS.map((key) => {
          const status = evaluateGoal(key, totals.totals[key], goals[key]);
          const { label, unit } = NUTRIENT_INFO[key];
          const color = statusColor(status);
          return (
            <View
              key={key}
              style={styles.row}
              accessible
              accessibilityLabel={accessibilityText(label, unit, key, status)}>
              <View style={styles.labelRow}>
                <Text style={styles.label} numberOfLines={1}>
                  {label}
                </Text>
                <StatusIcon status={status} />
              </View>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                {formatAmount(key, status.total)}
                <Text style={styles.goal}>
                  {status.goal != null ? ` / ${formatAmount(key, status.goal)}` : ''} {unit}
                </Text>
              </Text>
              {status.progress != null ? (
                <View style={styles.track}>
                  <View
                    style={[
                      styles.fill,
                      {
                        width: `${Math.min(status.progress, 1) * 100}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${withAlpha(color, 0.6)}`,
                      },
                    ]}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      {missing > 0 ? (
        <Text style={styles.missing}>
          {missing === 1 ? '1 food has' : `${missing} foods have`} no values, so totals may be low.
        </Text>
      ) : null}
    </View>
  );
}

function StatusIcon({ status }: { status: GoalStatus }) {
  if (status.met === true && (status.kind === 'min' || status.total > 0)) {
    return <Icon ios="checkmark.circle.fill" android="check_circle" size={12} color={colors.health[2]} />;
  }
  if (status.met === false && status.kind === 'max') {
    return <Icon ios="exclamationmark.circle.fill" android="error" size={12} color={colors.health[0]} />;
  }
  return null;
}

/** Limits: green while under, red when over. Targets: orange until reached, then green. */
function statusColor(status: GoalStatus): string {
  if (status.kind === 'max') return status.met === false ? colors.health[0] : colors.health[2];
  return status.met ? colors.health[2] : colors.health[1];
}

function accessibilityText(label: string, unit: string, key: (typeof NUTRIENTS)[number], status: GoalStatus): string {
  const total = `${label} ${formatAmount(key, status.total)} ${unit}`;
  if (status.goal == null) return `${total}, no goal`;
  const verdict =
    status.kind === 'max'
      ? status.met
        ? 'within limit'
        : 'over limit'
      : status.met
        ? 'target reached'
        : 'below target';
  return `${total} of ${formatAmount(key, status.goal)}, ${verdict}`;
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  columns: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  row: {
    flex: 1,
    gap: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  value: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  goal: {
    color: colors.textTertiary,
    fontWeight: '500',
  },
  track: {
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.pressedFill,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  missing: {
    color: colors.textTertiary,
    fontSize: 12,
  },
});
