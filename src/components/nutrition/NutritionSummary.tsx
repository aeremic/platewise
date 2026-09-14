import { StyleSheet, Text, type TextStyle, type StyleProp } from 'react-native';

import { formatAmount, NUTRIENTS, type Nutrition } from '@/domain/nutrition';
import { colors } from '@/theme';

const SUFFIX = { kcal: ' kcal', fiberG: ' g fiber', sugarG: ' g sugar' } as const;

/** "570 kcal · 4 g fiber · 8 g sugar"; unknown values are skipped ("No nutrition values" if none). */
export function NutritionSummary({ value, prefix, style }: { value: Nutrition; prefix?: string | null; style?: StyleProp<TextStyle> }) {
  const parts = NUTRIENTS.filter((key) => value[key] != null).map((key) => formatAmount(key, value[key]) + SUFFIX[key]);
  const text = [prefix, parts.length > 0 ? parts.join(' · ') : 'No nutrition values'].filter(Boolean).join(' · ');
  return (
    <Text style={[styles.text, style]} numberOfLines={2}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    color: colors.textSecondary,
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
