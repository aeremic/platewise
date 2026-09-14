import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { parseAmount } from '@/domain/nutrition';
import { colors, spacing } from '@/theme';

type Props = {
  label: string;
  unit: string;
  value: number | null;
  onChange: (value: number | null) => void;
  editable?: boolean;
  accessibilityLabel?: string;
};

/** Decimal input that keeps partial text like "12." while typing; empty = unknown (null). */
export function NumberField({ label, unit, value, onChange, editable = true, accessibilityLabel }: Props) {
  const [text, setText] = useState(toText(value));
  const [syncedValue, setSyncedValue] = useState(value);

  // Follow outside changes (e.g. the portion stepper) unless the text already means that value.
  if (value !== syncedValue) {
    setSyncedValue(value);
    if (parseAmount(text) !== value) setText(toText(value));
  }

  return (
    <View style={[styles.field, !editable && styles.disabled]}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.inputRow}>
        <TextInput
          value={text}
          editable={editable}
          onChangeText={(next) => {
            setText(next);
            const parsed = parseAmount(next);
            if (parsed !== undefined) onChange(parsed);
          }}
          keyboardType="decimal-pad"
          placeholder="–"
          placeholderTextColor={colors.textTertiary}
          selectTextOnFocus
          style={styles.input}
          accessibilityLabel={accessibilityLabel ?? `${label} in ${unit}`}
        />
        <Text style={styles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

function toText(value: number | null): string {
  return value == null ? '' : String(value);
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    gap: 4,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingHorizontal: spacing.sm,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontVariant: ['tabular-nums'],
    paddingVertical: 0,
  },
  unit: {
    color: colors.textTertiary,
    fontSize: 13,
    marginLeft: 4,
  },
});
