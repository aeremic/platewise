import { StyleSheet, View } from 'react-native';

import { NUTRIENT_INFO, NUTRIENTS, type Nutrition } from '@/domain/nutrition';
import { spacing } from '@/theme';

import { NumberField } from './NumberField';

type Props = {
  value: Nutrition;
  onChange: (value: Nutrition) => void;
};

/** kcal / fiber / sugar inputs side by side. */
export function NutritionFields({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {NUTRIENTS.map((key) => (
        <NumberField
          key={key}
          label={NUTRIENT_INFO[key].label}
          unit={NUTRIENT_INFO[key].unit}
          value={value[key]}
          onChange={(amount) => onChange({ ...value, [key]: amount })}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
});
