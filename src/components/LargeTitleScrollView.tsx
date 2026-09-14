import { StyleSheet, useWindowDimensions, type ScrollViewProps } from 'react-native';
import Animated, { useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/theme';

import { AmbientBackground } from './AmbientBackground';

/**
 * Root scroll view for pushed screens with a native large title.
 *
 * iOS only collapses the large title (and applies the header's scroll-edge effect) when the
 * ScrollView is the screen's root view, so it can't sit on top of a background view. The ambient
 * background therefore lives inside the ScrollView, counter-translated to look fixed.
 */
export function LargeTitleScrollView({ children, contentContainerStyle }: Pick<ScrollViewProps, 'children' | 'contentContainerStyle'>) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const backgroundStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value }] }));

  return (
    <Animated.ScrollView
      style={styles.screen}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }, contentContainerStyle]}>
      <Animated.View pointerEvents="none" style={[styles.background, { height }, backgroundStyle]}>
        <AmbientBackground />
      </Animated.View>
      {children}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
});
