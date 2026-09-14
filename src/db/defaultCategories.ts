import type { HealthLevel } from '@/domain/health';

export type DefaultCategory = {
  seedKey: string;
  name: string;
  emoji: string;
  health: HealthLevel;
  /** Typical portion; kcal / fiber / sugar below are for one of these. Approximate, user-editable. */
  portionLabel: string;
  kcal: number;
  fiberG: number;
  sugarG: number;
};

// seedKey must never change once shipped: it links a user's row back to its default.
// Changing values here only affects new installs and "Restore defaults"; existing installs got
// their values from drizzle/0003_nutrition_defaults.sql.
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { seedKey: 'salad', name: 'Salad', emoji: '🥗', health: 2, portionLabel: '1 bowl', kcal: 150, fiberG: 4, sugarG: 5 },
  { seedKey: 'vegetables', name: 'Vegetables', emoji: '🥦', health: 2, portionLabel: '1 cup', kcal: 60, fiberG: 4, sugarG: 4 },
  { seedKey: 'fruit', name: 'Fruit', emoji: '🍎', health: 2, portionLabel: '1 medium fruit', kcal: 95, fiberG: 4, sugarG: 19 },
  { seedKey: 'fish', name: 'Fish', emoji: '🐟', health: 2, portionLabel: '150 g fillet', kcal: 280, fiberG: 0, sugarG: 0 },
  { seedKey: 'grilled_chicken', name: 'Grilled chicken', emoji: '🍗', health: 2, portionLabel: '150 g', kcal: 250, fiberG: 0, sugarG: 0 },
  { seedKey: 'eggs', name: 'Eggs', emoji: '🥚', health: 2, portionLabel: '2 eggs', kcal: 155, fiberG: 0, sugarG: 1 },
  { seedKey: 'oatmeal', name: 'Oatmeal', emoji: '🥣', health: 2, portionLabel: '1 bowl', kcal: 250, fiberG: 5, sugarG: 8 },
  { seedKey: 'yogurt', name: 'Yogurt', emoji: '🥛', health: 2, portionLabel: '1 cup', kcal: 150, fiberG: 0, sugarG: 10 },
  { seedKey: 'nuts', name: 'Nuts', emoji: '🥜', health: 2, portionLabel: '30 g handful', kcal: 180, fiberG: 3, sugarG: 1 },
  { seedKey: 'legumes', name: 'Beans & lentils', emoji: '🫘', health: 2, portionLabel: '1 cup cooked', kcal: 230, fiberG: 15, sugarG: 2 },

  { seedKey: 'pasta', name: 'Pasta', emoji: '🍝', health: 1, portionLabel: '1 plate', kcal: 450, fiberG: 4, sugarG: 8 },
  { seedKey: 'rice', name: 'Rice', emoji: '🍚', health: 1, portionLabel: '1 cup cooked', kcal: 205, fiberG: 1, sugarG: 0 },
  { seedKey: 'bread', name: 'Bread', emoji: '🍞', health: 1, portionLabel: '2 slices', kcal: 160, fiberG: 2, sugarG: 3 },
  { seedKey: 'sandwich', name: 'Sandwich', emoji: '🥪', health: 1, portionLabel: '1 sandwich', kcal: 350, fiberG: 3, sugarG: 5 },
  { seedKey: 'cheese', name: 'Cheese', emoji: '🧀', health: 1, portionLabel: '30 g', kcal: 110, fiberG: 0, sugarG: 0 },
  { seedKey: 'red_meat', name: 'Red meat', emoji: '🥩', health: 1, portionLabel: '150 g', kcal: 375, fiberG: 0, sugarG: 0 },
  { seedKey: 'potatoes', name: 'Potatoes', emoji: '🥔', health: 1, portionLabel: '1 medium potato', kcal: 160, fiberG: 4, sugarG: 2 },
  { seedKey: 'sweet_coffee', name: 'Coffee with sugar', emoji: '☕', health: 1, portionLabel: '1 cup', kcal: 50, fiberG: 0, sugarG: 10 },

  { seedKey: 'pizza', name: 'Pizza', emoji: '🍕', health: 0, portionLabel: '2 slices', kcal: 570, fiberG: 4, sugarG: 8 },
  { seedKey: 'ice_cream', name: 'Ice cream', emoji: '🍦', health: 0, portionLabel: '2 scoops', kcal: 210, fiberG: 1, sugarG: 21 },
  { seedKey: 'burger', name: 'Burger', emoji: '🍔', health: 0, portionLabel: '1 burger', kcal: 550, fiberG: 2, sugarG: 9 },
  { seedKey: 'fries', name: 'Fries', emoji: '🍟', health: 0, portionLabel: 'medium portion', kcal: 365, fiberG: 4, sugarG: 0 },
  { seedKey: 'chips', name: 'Chips & snacks', emoji: '🍿', health: 0, portionLabel: '1 bag (40 g)', kcal: 215, fiberG: 2, sugarG: 1 },
  { seedKey: 'sweets', name: 'Sweets & chocolate', emoji: '🍫', health: 0, portionLabel: '50 g', kcal: 270, fiberG: 2, sugarG: 25 },
  { seedKey: 'soda', name: 'Soda', emoji: '🥤', health: 0, portionLabel: '330 ml can', kcal: 140, fiberG: 0, sugarG: 35 },
  { seedKey: 'cake', name: 'Cake & pastry', emoji: '🍰', health: 0, portionLabel: '1 slice', kcal: 350, fiberG: 1, sugarG: 30 },
  { seedKey: 'alcohol', name: 'Alcohol', emoji: '🍺', health: 0, portionLabel: '1 drink', kcal: 180, fiberG: 0, sugarG: 2 },
];
