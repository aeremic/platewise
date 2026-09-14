import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Glass } from '@/components/glass/Glass';
import { Icon } from '@/components/Icon';
import { LargeTitleScrollView } from '@/components/LargeTitleScrollView';
import { listActiveCategories } from '@/data/categoriesRepo';
import { getGoalsForDate } from '@/data/goalsRepo';
import { todayKey } from '@/domain/dates';
import { formatAmount, NUTRIENT_INFO, NUTRIENTS, type Goals } from '@/domain/nutrition';
import { useLiveData } from '@/hooks/useLiveData';
import { colors, spacing, type } from '@/theme';

export default function SettingsScreen() {
  const today = todayKey();
  const { data: goals } = useLiveData(() => getGoalsForDate(today), ['daily_goals'], today);
  const { data: categories = [] } = useLiveData(listActiveCategories, ['categories'], 'active');

  return (
    <LargeTitleScrollView>
      <Glass radius={22} style={styles.list}>
        <Row
          ios="target"
          android="track_changes"
          title="Daily goals"
          subtitle={goals ? goalsSummary(goals) : ' '}
          onPress={() => router.push('/settings/goals')}
        />
        <Row
          ios="square.grid.2x2"
          android="grid_view"
          title="Categories"
          subtitle={`${categories.length} categories · colors & nutrition`}
          onPress={() => router.push('/categories')}
          isLast
        />
      </Glass>
    </LargeTitleScrollView>
  );
}

function goalsSummary(goals: Goals): string {
  const parts = NUTRIENTS.filter((key) => goals[key] != null).map((key) => {
    const { unit, goalKind, label } = NUTRIENT_INFO[key];
    return `${goalKind === 'max' ? '≤' : '≥'} ${formatAmount(key, goals[key])} ${unit === 'g' ? `g ${label.toLowerCase()}` : unit}`;
  });
  return parts.length > 0 ? parts.join(' · ') : 'No goals set';
}

function Row({
  ios,
  android,
  title,
  subtitle,
  onPress,
  isLast = false,
}: {
  ios: Parameters<typeof Icon>[0]['ios'];
  android: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !isLast && styles.rowDivider, pressed && { backgroundColor: colors.pressedFill }]}>
      <View style={styles.rowIcon}>
        <Icon ios={ios} android={android} size={18} color={colors.accent} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
      <Icon ios="chevron.right" android="chevron_right" size={12} color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pressedFill,
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    ...type.body,
    color: colors.text,
    fontWeight: '600',
  },
  rowSubtitle: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: 2,
  },
});
