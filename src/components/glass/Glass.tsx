import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View, type ViewProps } from 'react-native';

import { colors, withAlpha } from '@/theme';

/** True on iOS 26+, where we can use Apple's real Liquid Glass. */
export const hasNativeGlass =
  Platform.OS === 'ios' && isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

export type GlassProps = ViewProps & {
  radius?: number;
  /** Hex color ('#RRGGBB') to tint the glass. */
  tint?: string;
  interactive?: boolean;
  variant?: 'regular' | 'clear';
};

/**
 * Liquid Glass on iOS 26+, and a frosted translucent panel with a specular
 * highlight everywhere else (Android, older iOS).
 */
export function Glass({
  radius = 24,
  tint,
  interactive = false,
  variant = 'regular',
  style,
  children,
  ...rest
}: GlassProps) {
  if (hasNativeGlass) {
    return (
      <GlassView
        glassEffectStyle={variant}
        tintColor={tint ? withAlpha(tint, 0.35) : undefined}
        isInteractive={interactive}
        colorScheme="dark"
        style={[{ borderRadius: radius }, style]}
        {...rest}>
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          borderRadius: radius,
          backgroundColor: tint ? withAlpha(tint, 0.24) : colors.glassFill,
          borderColor: tint ? withAlpha(tint, 0.45) : colors.hairline,
        },
        style,
      ]}
      {...rest}>
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(255,255,255,0.14)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']}
        locations={[0, 0.45, 1]}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    borderWidth: StyleSheet.hairlineWidth * 2,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
  },
});
