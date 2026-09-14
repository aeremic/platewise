import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HealthLevel } from '@/domain/health';
import { scaleNutrition, type Nutrition } from '@/domain/nutrition';
import { categoryEmoji } from '@/lib/emoji';
import { haptics } from '@/lib/haptics';
import { colors, healthColor, spacing, withAlpha } from '@/theme';

import { NutritionFields } from './NutritionFields';
import { NutritionSummary } from './NutritionSummary';
import { PortionStepper } from './PortionStepper';

export type Amount = { portions: number; nutrition: Nutrition };

/** Changing portions scales the current values, including ones typed by hand. */
export function withPortions(amount: Amount, portions: number): Amount {
  return { portions, nutrition: scaleNutrition(amount.nutrition, portions / amount.portions) };
}

type Props = {
  name: string;
  emoji: string | null;
  health: HealthLevel;
  portionLabel: string | null;
  amount: Amount;
  onChange: (amount: Amount) => void;
  onRemove: () => void;
};

/** A food about to be logged: portion stepper, values, and optional exact editing. */
export function AmountCard({ name, emoji, health, portionLabel, amount, onChange, onRemove }: Props) {
  const [editing, setEditing] = useState(false);

  return (
    <View style={[styles.card, { borderColor: withAlpha(healthColor(health), 0.35) }]}>
      <View style={styles.top}>
        <Text style={styles.emoji}>{categoryEmoji(emoji)}</Text>
        <View style={styles.titles}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          {portionLabel ? (
            <Text style={styles.portion} numberOfLines={1}>
              1× = {portionLabel}
            </Text>
          ) : null}
        </View>
        <PortionStepper portions={amount.portions} onChange={(portions) => onChange(withPortions(amount, portions))} />
      </View>

      {editing ? (
        <NutritionFields value={amount.nutrition} onChange={(nutrition) => onChange({ ...amount, nutrition })} />
      ) : (
        <NutritionSummary value={amount.nutrition} />
      )}

      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => {
            haptics.tap();
            setEditing((e) => !e);
          }}>
          <Text style={styles.link}>{editing ? 'Done editing' : 'Edit values'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`Don't add ${name}`} hitSlop={8} onPress={onRemove}>
          <Text style={styles.remove}>Remove</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: colors.glassFill,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  emoji: {
    fontSize: 22,
  },
  titles: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  portion: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  link: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  remove: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
});
