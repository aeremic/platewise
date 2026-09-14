import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { clampPortions, formatPortions, MAX_PORTIONS, MIN_PORTIONS, PORTION_STEP } from '@/domain/nutrition';
import { haptics } from '@/lib/haptics';
import { colors } from '@/theme';

type Props = {
  portions: number;
  onChange: (portions: number) => void;
};

export function PortionStepper({ portions, onChange }: Props) {
  const step = (direction: 1 | -1) => {
    const next = clampPortions(portions + direction * PORTION_STEP);
    if (next === portions) return;
    haptics.tap();
    onChange(next);
  };

  return (
    <View style={styles.stepper} accessibilityRole="adjustable" accessibilityLabel={`${formatPortions(portions)} portions`}>
      <StepButton
        label="Fewer portions"
        disabled={portions <= MIN_PORTIONS}
        onPress={() => step(-1)}
        icon={<Icon ios="minus" android="remove" size={14} />}
      />
      <Text style={styles.value}>{formatPortions(portions)}×</Text>
      <StepButton
        label="More portions"
        disabled={portions >= MAX_PORTIONS}
        onPress={() => step(1)}
        icon={<Icon ios="plus" android="add" size={14} />}
      />
    </View>
  );
}

function StepButton({
  label,
  disabled,
  onPress,
  icon,
}: {
  label: string;
  disabled: boolean;
  onPress: () => void;
  icon: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={6}
      style={({ pressed }) => [
        styles.button,
        disabled && styles.buttonDisabled,
        { transform: [{ scale: pressed ? 0.9 : 1 }] },
      ]}>
      {icon}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 3,
    borderRadius: 999,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  button: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.pressedFill,
  },
  buttonDisabled: {
    opacity: 0.35,
  },
  value: {
    minWidth: 34,
    textAlign: 'center',
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
