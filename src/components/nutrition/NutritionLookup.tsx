import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/Icon';
import type { Nutrition } from '@/domain/nutrition';
import { haptics } from '@/lib/haptics';
import { askAiUrl, nutritionForPortion, searchUsdaFoods, UsdaError, type UsdaFood, type UsdaPortion } from '@/services/usda';
import { colors, spacing, withAlpha } from '@/theme';

import { NutritionSummary } from './NutritionSummary';

export type LookupResult = {
  portionLabel: string;
  nutrition: Nutrition;
  /** Human-readable origin, e.g. "Dessert pizza · USDA". */
  source: string;
};

type Props = {
  foodName: string;
  portionLabel: string;
  onApply: (result: LookupResult) => void;
  /** Called when a lookup can't run, e.g. no name typed yet. */
  onNeedName: () => void;
};

type State =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'results'; foods: UsdaFood[]; query: string }
  | { status: 'error'; message: string };

/** "Look up" (USDA database, autofills) and "Ask AI" (Google AI Mode in an in-app browser). */
export function NutritionLookup({ foodName, portionLabel, onApply, onNeedName }: Props) {
  const [state, setState] = useState<State>({ status: 'idle' });
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const name = foodName.trim();

  const lookUp = async () => {
    if (!name) return onNeedName();
    haptics.tap();
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setState({ status: 'loading' });
    try {
      const foods = await searchUsdaFoods(name, controller.signal);
      if (!controller.signal.aborted) setState({ status: 'results', foods, query: name });
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({
        status: 'error',
        message: error instanceof UsdaError ? error.message : 'Something went wrong. Try Ask AI instead.',
      });
    }
  };

  const askAi = () => {
    if (!name) return onNeedName();
    haptics.tap();
    void WebBrowser.openBrowserAsync(askAiUrl(name, portionLabel), {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
      controlsColor: colors.accent,
      toolbarColor: colors.sheetBackground,
      dismissButtonStyle: 'done',
    });
  };

  const apply = (food: UsdaFood, portion: UsdaPortion) => {
    haptics.success();
    onApply({ portionLabel: portion.label, nutrition: nutritionForPortion(food, portion), source: `${food.description} · USDA` });
    setState({ status: 'idle' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.buttons}>
        <LookupButton
          icon={<Icon ios="magnifyingglass" android="search" size={16} color={colors.accent} />}
          title="Look up"
          subtitle="Fill from food database"
          onPress={lookUp}
        />
        <LookupButton
          icon={<Icon ios="sparkles" android="auto_awesome" size={16} color={colors.accent} />}
          title="Ask AI"
          subtitle="Google AI Mode"
          onPress={askAi}
        />
      </View>

      {state.status === 'loading' ? (
        <View style={styles.message}>
          <ActivityIndicator color={colors.textSecondary} />
          <Text style={styles.messageText}>Searching “{name}”…</Text>
        </View>
      ) : null}

      {state.status === 'error' ? (
        <View style={styles.message}>
          <Icon ios="exclamationmark.triangle" android="warning" size={14} color={colors.health[1]} />
          <Text style={styles.messageText}>{state.message}</Text>
        </View>
      ) : null}

      {state.status === 'results' ? (
        <View style={styles.results}>
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsTitle}>
              {state.foods.length > 0 ? 'Tap a portion to fill in its values' : `No matches for “${state.query}”`}
            </Text>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setState({ status: 'idle' })}>
              <Text style={styles.link}>Close</Text>
            </Pressable>
          </View>
          {state.foods.length === 0 ? (
            <Text style={styles.messageText}>Try a simpler or English name, or use Ask AI.</Text>
          ) : null}
          {state.foods.map((food) => (
            <FoodResult key={food.fdcId} food={food} onApply={(portion) => apply(food, portion)} />
          ))}
          {state.foods.length > 0 ? (
            <Text style={styles.attribution}>Source: USDA FoodData Central. Values are estimates.</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function LookupButton({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${subtitle}`}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { transform: [{ scale: pressed ? 0.97 : 1 }] }]}>
      <View style={styles.buttonIcon}>{icon}</View>
      <View style={styles.buttonText}>
        <Text style={styles.buttonTitle}>{title}</Text>
        <Text style={styles.buttonSubtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function FoodResult({ food, onApply }: { food: UsdaFood; onApply: (portion: UsdaPortion) => void }) {
  // Preview the first household portion (or 100 g) so values are comparable at a glance.
  const preview = food.portions[0];
  return (
    <View style={styles.food}>
      <Text style={styles.foodName} numberOfLines={2}>
        {food.description}
      </Text>
      <NutritionSummary value={nutritionForPortion(food, preview)} prefix={preview.label} />
      <View style={styles.portions}>
        {food.portions.slice(0, 5).map((portion) => (
          <Pressable
            key={portion.label}
            accessibilityRole="button"
            accessibilityLabel={`Use ${portion.label} of ${food.description}`}
            onPress={() => onApply(portion)}
            style={({ pressed }) => [styles.portion, pressed && styles.portionPressed]}>
            <Text style={styles.portionText} numberOfLines={1}>
              {portion.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  buttons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: withAlpha(colors.accent, 0.45),
    backgroundColor: withAlpha(colors.accent, 0.12),
  },
  buttonIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: withAlpha(colors.accent, 0.18),
  },
  buttonText: {
    flex: 1,
  },
  buttonTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  buttonSubtitle: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 1,
  },
  message: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  messageText: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
  },
  results: {
    gap: spacing.sm,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsTitle: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  link: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  food: {
    gap: 6,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: colors.glassFill,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  foodName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  portions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  portion: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.pressedFill,
    borderWidth: 1,
    borderColor: colors.hairline,
    maxWidth: '100%',
  },
  portionPressed: {
    borderColor: colors.accent,
    backgroundColor: withAlpha(colors.accent, 0.25),
  },
  portionText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  attribution: {
    color: colors.textTertiary,
    fontSize: 11,
  },
});
