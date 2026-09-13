import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { haptics } from '@/lib/haptics';

import { Glass } from './Glass';

type Props = {
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
  /** Layout of the button (position, margins, fixed size). */
  style?: StyleProp<ViewStyle>;
  /** Layout of the content inside the glass (padding, gap). */
  contentStyle?: StyleProp<ViewStyle>;
  radius?: number;
  tint?: string;
  disabled?: boolean;
};

export function GlassButton({
  onPress,
  accessibilityLabel,
  children,
  style,
  contentStyle,
  radius = 999,
  tint,
  disabled,
}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      style={({ pressed }) => [style, { transform: [{ scale: pressed ? 0.95 : 1 }] }]}>
      {/* Not `interactive`: native interactive glass swallows the first tap before Pressable sees it. */}
      <Glass radius={radius} tint={tint} style={[styles.content, contentStyle]}>
        {children}
      </Glass>
    </Pressable>
  );
}

export function IconButton({
  size = 44,
  ...props
}: Omit<Props, 'contentStyle' | 'radius'> & { size?: number }) {
  return (
    <GlassButton
      {...props}
      radius={size / 2}
      contentStyle={{ width: size, height: size, opacity: props.disabled ? 0.4 : 1 }}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
