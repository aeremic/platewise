import { router, Stack } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AmbientBackground } from '@/components/AmbientBackground';
import { HealthDot } from '@/components/CategoryChip';
import { Glass } from '@/components/glass/Glass';
import { GlassButton } from '@/components/glass/GlassButton';
import { Icon } from '@/components/Icon';
import {
  listActiveCategories,
  listArchivedCategories,
  restoreCategory,
  restoreDefaultCategories,
} from '@/data/categoriesRepo';
import type { Category } from '@/db/schema';
import { HEALTH_LABELS, HEALTH_LEVELS } from '@/domain/health';
import { useLiveData } from '@/hooks/useLiveData';
import { categoryEmoji } from '@/lib/emoji';
import { haptics } from '@/lib/haptics';
import { colors, spacing, type } from '@/theme';

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });
  const backgroundStyle = useAnimatedStyle(() => ({ transform: [{ translateY: scrollY.value }] }));
  const { data: active = [] } = useLiveData(listActiveCategories, ['categories'], 'active');
  const { data: archived = [] } = useLiveData(listArchivedCategories, ['categories'], 'archived');

  const openEditor = (id: number | 'new') =>
    router.push({ pathname: '/categories/[id]', params: { id: String(id) } });

  const confirmRestoreDefaults = () =>
    Alert.alert(
      'Restore default categories?',
      'Built-in categories come back with their original names, emoji and colors. Categories you created are removed; days you already logged keep their colors.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            await restoreDefaultCategories();
            haptics.success();
          },
        },
      ],
    );

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="New category"
              onPress={() => openEditor('new')}
              hitSlop={10}
              style={styles.headerButton}>
              <Icon ios="plus" android="add" size={20} />
            </Pressable>
          ),
        }}
      />
      {/* The ScrollView must be the screen's root view so the iOS large title can collapse
          and the header gets its scroll-edge effect; the background therefore lives inside it
          and is counter-translated to stay fixed. */}
      <Animated.ScrollView
        style={styles.screen}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xxl }]}>
        <Animated.View pointerEvents="none" style={[styles.background, { height: windowHeight }, backgroundStyle]}>
          <AmbientBackground />
        </Animated.View>
        <Text style={styles.intro}>
          Colors decide how each day looks on your calendar. Changing a color also updates past days.
        </Text>

        {HEALTH_LEVELS.map((level) => {
          const group = active.filter((c) => c.health === level);
          return (
            <View key={level} style={styles.section}>
              <View style={styles.sectionHeader}>
                <HealthDot level={level} size={10} />
                <Text style={styles.sectionTitle}>{HEALTH_LABELS[level]}</Text>
                <Text style={styles.sectionCount}>{group.length}</Text>
              </View>
              {group.length > 0 ? (
                <Glass radius={22} style={styles.list}>
                  {group.map((category, i) => (
                    <CategoryRow
                      key={category.id}
                      category={category}
                      isLast={i === group.length - 1}
                      onPress={() => openEditor(category.id)}
                    />
                  ))}
                </Glass>
              ) : (
                <Text style={styles.empty}>No {HEALTH_LABELS[level].toLowerCase()} categories.</Text>
              )}
            </View>
          );
        })}

        {archived.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon ios="archivebox" android="inventory_2" size={14} color={colors.textSecondary} />
              <Text style={styles.sectionTitle}>Hidden</Text>
              <Text style={styles.sectionCount}>{archived.length}</Text>
            </View>
            <Text style={styles.hint}>Removed categories that still appear on past days.</Text>
            <Glass radius={22} style={styles.list}>
              {archived.map((category, i) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  isLast={i === archived.length - 1}
                  actionLabel="Restore"
                  onPress={async () => {
                    await restoreCategory(category.id);
                    haptics.success();
                  }}
                />
              ))}
            </Glass>
          </View>
        ) : null}

        <GlassButton
          accessibilityLabel="Restore default categories"
          onPress={confirmRestoreDefaults}
          style={styles.restore}
          contentStyle={styles.restoreContent}>
          <Icon ios="arrow.counterclockwise" android="restart_alt" size={16} color={colors.textSecondary} />
          <Text style={styles.restoreText}>Restore defaults</Text>
        </GlassButton>
      </Animated.ScrollView>
    </>
  );
}

function CategoryRow({
  category,
  isLast,
  actionLabel,
  onPress,
}: {
  category: Category;
  isLast: boolean;
  actionLabel?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={actionLabel ? `${actionLabel} ${category.name}` : `Edit ${category.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        !isLast && styles.rowDivider,
        pressed && { backgroundColor: colors.pressedFill },
      ]}>
      <Text style={styles.rowEmoji}>{categoryEmoji(category.emoji)}</Text>
      <Text style={styles.rowName} numberOfLines={1}>
        {category.name}
      </Text>
      {actionLabel ? (
        <Text style={styles.rowAction}>{actionLabel}</Text>
      ) : (
        <>
          <HealthDot level={category.health} />
          <Icon ios="chevron.right" android="chevron_right" size={12} color={colors.textTertiary} />
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
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
  intro: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 21,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  sectionTitle: {
    ...type.overline,
    color: colors.textSecondary,
  },
  sectionCount: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 13,
    paddingHorizontal: spacing.xs,
  },
  empty: {
    color: colors.textTertiary,
    fontSize: 15,
    paddingHorizontal: spacing.xs,
  },
  list: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    minHeight: 52,
  },
  rowDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.hairline,
  },
  rowEmoji: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  rowName: {
    ...type.body,
    color: colors.text,
    flex: 1,
  },
  rowAction: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  restore: {
    alignSelf: 'center',
  },
  restoreContent: {
    height: 44,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  restoreText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
});
