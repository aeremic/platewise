import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, IconButton } from '@/components/glass/GlassButton';
import { Icon } from '@/components/Icon';
import { NumberField } from '@/components/nutrition/NumberField';
import { getGoalsForDate, saveGoals } from '@/data/goalsRepo';
import { todayKey } from '@/domain/dates';
import { DEFAULT_GOALS, NUTRIENT_INFO, NUTRIENTS, type Goals, type NutrientKey } from '@/domain/nutrition';
import { haptics } from '@/lib/haptics';
import { colors, spacing, type } from '@/theme';

const DESCRIPTIONS: Record<NutrientKey, string> = {
  kcal: 'Stay under this many calories',
  fiberG: 'Reach at least this much fiber',
  sugarG: 'Stay under this much sugar',
};

export default function GoalsSheet() {
  const insets = useSafeAreaInsets();
  const [goals, setGoals] = useState<Goals>();
  // Values stay remembered while a goal is switched off, so toggling back restores them.
  const [enabled, setEnabled] = useState<Record<NutrientKey, boolean>>({ kcal: true, fiberG: true, sugarG: true });
  const [values, setValues] = useState<Goals>(DEFAULT_GOALS);

  useEffect(() => {
    getGoalsForDate(todayKey()).then((loaded) => {
      setGoals(loaded);
      setEnabled({ kcal: loaded.kcal != null, fiberG: loaded.fiberG != null, sugarG: loaded.sugarG != null });
      setValues({
        kcal: loaded.kcal ?? DEFAULT_GOALS.kcal,
        fiberG: loaded.fiberG ?? DEFAULT_GOALS.fiberG,
        sugarG: loaded.sugarG ?? DEFAULT_GOALS.sugarG,
      });
    });
  }, []);

  const save = async () => {
    const next = Object.fromEntries(
      NUTRIENTS.map((key) => [key, enabled[key] && values[key] != null && values[key] > 0 ? values[key] : null]),
    ) as Goals;
    await saveGoals(next);
    haptics.success();
    router.back();
  };

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.topBar}>
        <IconButton size={40} accessibilityLabel="Close" onPress={() => router.back()}>
          <Icon ios="xmark" android="close" size={16} />
        </IconButton>
        <Text style={styles.title}>Daily goals</Text>
        <GlassButton
          accessibilityLabel="Save goals"
          onPress={save}
          disabled={!goals}
          tint={colors.accent}
          contentStyle={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </GlassButton>
      </View>

      {NUTRIENTS.map((key) => (
        <View key={key} style={styles.goal}>
          <View style={styles.goalHeader}>
            <View style={styles.goalText}>
              <Text style={styles.goalTitle}>{NUTRIENT_INFO[key].label}</Text>
              <Text style={styles.goalDescription}>{DESCRIPTIONS[key]}</Text>
            </View>
            <Switch
              value={enabled[key]}
              onValueChange={(on) => {
                haptics.tap();
                setEnabled((e) => ({ ...e, [key]: on }));
              }}
              trackColor={{ true: colors.accent, false: colors.pressedFill }}
              thumbColor={colors.text}
              accessibilityLabel={`${NUTRIENT_INFO[key].label} goal`}
            />
          </View>
          <NumberField
            label={NUTRIENT_INFO[key].goalKind === 'max' ? 'Daily limit' : 'Daily target'}
            unit={NUTRIENT_INFO[key].unit}
            value={values[key]}
            editable={enabled[key]}
            onChange={(amount) => setValues((v) => ({ ...v, [key]: amount }))}
          />
        </View>
      ))}

      <Text style={styles.hint}>New goals apply from today. Past days keep the goals they had.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    ...type.headline,
    color: colors.text,
  },
  saveButton: {
    height: 40,
    paddingHorizontal: spacing.lg,
  },
  saveText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  goal: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  goalText: {
    flex: 1,
  },
  goalTitle: {
    ...type.headline,
    color: colors.text,
  },
  goalDescription: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
  },
});
