import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { GlassButton, IconButton } from '@/components/glass/GlassButton';
import { Icon } from '@/components/Icon';
import { NutritionFields } from '@/components/nutrition/NutritionFields';
import {
  createCategory,
  getCategory,
  listActiveCategories,
  removeCategory,
  updateCategory,
} from '@/data/categoriesRepo';
import type { Category } from '@/db/schema';
import { HEALTH_LABELS, HEALTH_LEVELS, type HealthLevel } from '@/domain/health';
import { EMPTY_NUTRITION, type Nutrition } from '@/domain/nutrition';
import { categoryEvents } from '@/lib/categoryEvents';
import { FALLBACK_EMOJI, FOOD_EMOJIS } from '@/lib/emoji';
import { haptics } from '@/lib/haptics';
import { colors, healthColor, spacing, type, withAlpha } from '@/theme';

export default function CategoryEditorSheet() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const isNew = id === 'new';
  const numericId = Number(id);

  const [existing, setExisting] = useState<Category>();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [health, setHealth] = useState<HealthLevel>(2);
  const [portionLabel, setPortionLabel] = useState('');
  const [nutrition, setNutrition] = useState<Nutrition>(EMPTY_NUTRITION);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (isNew) return;
    getCategory(numericId).then((category) => {
      if (!category) return;
      setExisting(category);
      setName(category.name);
      setEmoji(category.emoji ?? '');
      setHealth(category.health);
      setPortionLabel(category.portionLabel ?? '');
      setNutrition({ kcal: category.kcal, fiberG: category.fiberG, sugarG: category.sugarG });
    });
  }, [isNew, numericId]);

  const save = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Give the category a name.');
      return;
    }
    const duplicate = (await listActiveCategories()).some(
      (c) => c.id !== existing?.id && c.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (duplicate) {
      setError(`“${trimmed}” already exists.`);
      return;
    }

    const input = { name: trimmed, emoji, health, portionLabel, ...nutrition };
    if (existing) {
      await updateCategory(existing.id, input);
    } else {
      categoryEvents.emitCreated(await createCategory(input));
    }
    haptics.success();
    router.back();
  };

  const confirmRemove = () => {
    if (!existing) return;
    Alert.alert(
      `Remove “${existing.name}”?`,
      'If it’s already on your calendar it will be hidden instead, so past days keep their colors. You can restore it from Categories.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeCategory(existing.id);
            haptics.warning();
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={styles.sheet}>
      {/* Form sheet layout: exactly [header, ScrollView]; the header must not be flattened. */}
      <View style={styles.topBar} collapsable={false}>
        <IconButton size={40} accessibilityLabel="Close" onPress={() => router.back()}>
          <Icon ios="xmark" android="close" size={16} />
        </IconButton>
        <Text style={styles.title}>{isNew ? 'New category' : 'Edit category'}</Text>
        <GlassButton
          accessibilityLabel="Save category"
          onPress={save}
          tint={colors.accent}
          contentStyle={styles.saveButton}>
          <Text style={styles.saveText}>Save</Text>
        </GlassButton>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets>
        <View style={styles.fields}>
          <TextInput
            value={emoji}
            onChangeText={(text) => setEmoji(lastGrapheme(text))}
            placeholder={FALLBACK_EMOJI}
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, styles.emojiInput]}
            accessibilityLabel="Emoji"
          />
          <TextInput
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(undefined);
            }}
            placeholder="Name, e.g. Sushi"
            placeholderTextColor={colors.textTertiary}
            style={[styles.input, styles.nameInput]}
            autoFocus={isNew}
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={save}
            maxLength={40}
            accessibilityLabel="Name"
          />
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* A wrapping grid rather than a horizontal ScrollView, which would confuse the sheet's scroll handling. */}
        <View style={styles.emojiGrid}>
          {FOOD_EMOJIS.map((option) => {
            const selected = option === (emoji || FALLBACK_EMOJI);
            return (
              <Pressable
                key={option}
                accessibilityRole="button"
                accessibilityLabel={`Use ${option}`}
                accessibilityState={{ selected }}
                onPress={() => {
                  haptics.tap();
                  setEmoji(option === FALLBACK_EMOJI ? '' : option);
                }}
                style={({ pressed }) => [styles.emojiCell, { transform: [{ scale: pressed ? 0.9 : 1 }] }]}>
                <View style={[styles.emojiOption, selected && styles.emojiOptionSelected]}>
                  <Text style={styles.emojiOptionText}>{option}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>How healthy is it?</Text>
        <View style={styles.levels}>
          {HEALTH_LEVELS.map((level) => {
            const selected = level === health;
            const color = healthColor(level);
            return (
              <Pressable
                key={level}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                accessibilityLabel={HEALTH_LABELS[level]}
                onPress={() => {
                  haptics.tap();
                  setHealth(level);
                }}
                style={({ pressed }) => [
                  styles.level,
                  {
                    borderColor: selected ? color : withAlpha(color, 0.3),
                    backgroundColor: selected ? withAlpha(color, 0.28) : colors.glassFill,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  },
                  selected && { boxShadow: `0 0 16px ${withAlpha(color, 0.45)}` },
                ]}>
                <View style={[styles.levelDot, { backgroundColor: color }]} />
                <Text style={styles.levelText}>{HEALTH_LABELS[level]}</Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>Nutrition per portion</Text>
        <TextInput
          value={portionLabel}
          onChangeText={setPortionLabel}
          placeholder="One portion is… e.g. 2 slices, 1 bowl"
          placeholderTextColor={colors.textTertiary}
          style={styles.input}
          maxLength={40}
          accessibilityLabel="Portion size"
        />
        <NutritionFields value={nutrition} onChange={setNutrition} />
        <Text style={styles.hint}>
          {existing
            ? 'Used for foods you log from now on; days you already logged keep their values. Leave empty if unknown.'
            : 'Leave a value empty if you don’t know it.'}
        </Text>

        {existing ? (
          <Pressable accessibilityRole="button" onPress={confirmRemove} style={styles.remove} hitSlop={8}>
            <Icon ios="trash" android="delete" size={16} color={colors.destructive} />
            <Text style={styles.removeText}>Remove category</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

/** Keeps only the most recently typed emoji/character. */
function lastGrapheme(text: string): string {
  // Not every JS engine build ships Intl.Segmenter; code points are a decent fallback.
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    const segments = [...new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(text)];
    return segments.at(-1)?.segment ?? '';
  }
  return Array.from(text).at(-1) ?? '';
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    ...type.headline,
    color: colors.text,
  },
  saveButton: {
    height: 40,
    paddingHorizontal: spacing.lg,
  },
  saveText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  fields: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  input: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
    color: colors.text,
    fontSize: 17,
    paddingHorizontal: spacing.md,
  },
  emojiInput: {
    width: 56,
    textAlign: 'center',
    fontSize: 24,
    paddingHorizontal: 0,
  },
  nameInput: {
    flex: 1,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: -spacing.xs,
  },
  emojiCell: {
    width: '12.5%',
    aspectRatio: 1,
    padding: 2,
  },
  emojiOption: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  emojiOptionSelected: {
    backgroundColor: colors.pressedFill,
    borderColor: colors.accent,
  },
  emojiOptionText: {
    fontSize: 24,
  },
  hint: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: -spacing.sm,
  },
  error: {
    color: colors.destructive,
    fontSize: 14,
    marginTop: -spacing.sm,
  },
  label: {
    ...type.overline,
    color: colors.textSecondary,
  },
  levels: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: -spacing.xs,
  },
  level: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  levelDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  levelText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  remove: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  removeText: {
    color: colors.destructive,
    fontSize: 16,
    fontWeight: '600',
  },
});
