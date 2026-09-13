import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HealthLevel } from '@/domain/health';
import { colors, healthColor, withAlpha } from '@/theme';

import { Icon } from './Icon';

type Props = {
  name: string;
  emoji: string | null;
  health: HealthLevel;
  selected?: boolean;
  /** Shows a trailing × (used for already-logged entries). */
  removable?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function CategoryChip({
  name,
  emoji,
  health,
  selected = false,
  removable = false,
  onPress,
  accessibilityLabel,
}: Props) {
  const color = healthColor(health);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? name}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? withAlpha(color, 0.32) : colors.glassFill,
          borderColor: selected ? color : withAlpha(color, 0.35),
          transform: [{ scale: pressed ? 0.94 : 1 }],
        },
        selected && { boxShadow: `0 0 12px ${withAlpha(color, 0.45)}` },
      ]}>
      {emoji ? <Text style={styles.emoji}>{emoji}</Text> : <View style={[styles.dot, { backgroundColor: color }]} />}
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      {selected ? <Icon ios="checkmark" android="check" size={14} color={colors.text} /> : null}
      {removable ? <Icon ios="xmark" android="close" size={12} color={colors.textSecondary} /> : null}
    </Pressable>
  );
}

export function HealthDot({ level, size = 8 }: { level: HealthLevel; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: healthColor(level),
        boxShadow: `0 0 6px ${withAlpha(healthColor(level), 0.7)}`,
      }}
    />
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  emoji: {
    fontSize: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
});
