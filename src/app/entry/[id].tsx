import { format } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, IconButton } from '@/components/glass/GlassButton';
import { Icon } from '@/components/Icon';
import { withPortions, type Amount } from '@/components/nutrition/AmountCard';
import { NutritionFields } from '@/components/nutrition/NutritionFields';
import { PortionStepper } from '@/components/nutrition/PortionStepper';
import { DayPreview } from '@/components/rating/DayPreview';
import { deleteEntry, getEntriesForDate, getEntry, updateEntry, type EntryWithCategory } from '@/data/entriesRepo';
import { getGoalsForDate } from '@/data/goalsRepo';
import { rateDay } from '@/domain/dayRating';
import { fromDateKey } from '@/domain/dates';
import { NUTRIENTS } from '@/domain/nutrition';
import { useLiveData } from '@/hooks/useLiveData';
import { categoryEmoji } from '@/lib/emoji';
import { haptics } from '@/lib/haptics';
import { colors, spacing, type } from '@/theme';

/** Edit a logged food: portions, exact values, or remove it. */
export default function EntryEditorSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const [entry, setEntry] = useState<EntryWithCategory>();
  const [amount, setAmount] = useState<Amount>();

  useEffect(() => {
    getEntry(Number(id)).then((loaded) => {
      if (!loaded) return;
      setEntry(loaded);
      setAmount({ portions: loaded.portions, nutrition: loaded.nutrition });
    });
  }, [id]);

  // Live preview of the whole day with this food's unsaved amounts; closing discards them.
  const dayKey = entry?.date ?? '';
  const { data: dayEntries = [] } = useLiveData(
    () => (entry ? getEntriesForDate(entry.date) : Promise.resolve([])),
    ['entries', 'categories'],
    dayKey,
  );
  const { data: dayGoals } = useLiveData(
    () => (entry ? getGoalsForDate(entry.date) : Promise.resolve(undefined)),
    ['daily_goals'],
    dayKey,
  );
  const changed =
    !!entry &&
    !!amount &&
    (amount.portions !== entry.portions ||
      NUTRIENTS.some((key) => amount.nutrition[key] !== entry.nutrition[key]));
  const rating =
    entry && amount && dayGoals
      ? rateDay(
          dayEntries.map((e) => (e.id === entry.id ? { ...e, portions: amount.portions, nutrition: amount.nutrition } : e)),
          dayGoals,
        )
      : null;

  const save = async () => {
    if (!entry || !amount) return;
    await updateEntry(entry.id, amount);
    haptics.success();
    router.back();
  };

  const confirmRemove = () => {
    if (!entry) return;
    Alert.alert(`Remove ${entry.name}?`, `It will be removed from ${format(fromDateKey(entry.date), 'MMMM d')}.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await deleteEntry(entry.id);
          haptics.warning();
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.topBar}>
        <IconButton size={40} accessibilityLabel="Close" onPress={() => router.back()}>
          <Icon ios="xmark" android="close" size={16} />
        </IconButton>
        <Text style={styles.title}>Edit food</Text>
        <GlassButton
          accessibilityLabel="Save changes"
          onPress={save}
          disabled={!amount}
          tint={colors.accent}
          contentStyle={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </GlassButton>
      </View>

      {entry && amount ? (
        <>
          <View style={styles.food}>
            <Text style={styles.emoji}>{categoryEmoji(entry.emoji)}</Text>
            <View style={styles.foodText}>
              <Text style={styles.name} numberOfLines={1}>
                {entry.name}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {format(fromDateKey(entry.date), 'EEEE, MMMM d')}
              </Text>
              {entry.portionLabel ? (
                <Text style={styles.meta} numberOfLines={1}>
                  1× = {entry.portionLabel}
                </Text>
              ) : null}
            </View>
            <PortionStepper portions={amount.portions} onChange={(portions) => setAmount(withPortions(amount, portions))} />
          </View>

          <Text style={styles.label}>What you ate</Text>
          <NutritionFields value={amount.nutrition} onChange={(nutrition) => setAmount({ ...amount, nutrition })} />
          <Text style={styles.hint}>
            Changing portions scales these values. They stay as saved even if you edit the category later.
          </Text>

          {rating && dayGoals ? (
            <DayPreview rating={rating} goals={dayGoals} unsavedLabel={changed ? 'includes unsaved changes' : null} />
          ) : null}

          <Pressable accessibilityRole="button" onPress={confirmRemove} style={styles.remove} hitSlop={8}>
            <Icon ios="trash" android="delete" size={16} color={colors.destructive} />
            <Text style={styles.removeText}>Remove from this day</Text>
          </Pressable>
        </>
      ) : null}
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
  food: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  emoji: {
    fontSize: 30,
  },
  foodText: {
    flex: 1,
  },
  name: {
    ...type.headline,
    color: colors.text,
  },
  meta: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: 2,
  },
  label: {
    ...type.overline,
    color: colors.textSecondary,
    marginBottom: -spacing.sm,
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: -spacing.sm,
  },
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  removeText: {
    color: colors.destructive,
    fontSize: 16,
    fontWeight: '600',
  },
});
