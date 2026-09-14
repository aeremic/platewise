import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { HealthLevel } from '@/domain/health';
import { categoryEmoji } from '@/lib/emoji';
import { colors, healthColor, withAlpha } from '@/theme';

import { Icon } from './Icon';

type Props = {
  name: string;
  emoji: string | null;
  health: HealthLevel;
  selected?: boolean;
  /** Small trailing text, e.g. "2×" for a logged entry with two portions. */
  detail?: string;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function CategoryChip({
  name,
  emoji,
  health,
  selected = false,
  detail,
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
      <Text style={styles.emoji}>{categoryEmoji(emoji)}</Text>
      <Text style={styles.name} numberOfLines={1}>
        {name}
      </Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
      {/* Overlaid badge so selecting doesn't change the chip's width and reflow the rows. */}
      {selected ? (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Icon ios="checkmark" android="check" size={10} color={colors.background} />
        </View>
      ) : null}
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
  name: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '500',
    flexShrink: 1,
  },
  detail: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
});
