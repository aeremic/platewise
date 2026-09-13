import type { HealthLevel } from '@/domain/health';

export type DefaultCategory = {
  seedKey: string;
  name: string;
  emoji: string;
  health: HealthLevel;
};

// seedKey must never change once shipped: it links a user's row back to its default.
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  { seedKey: 'salad', name: 'Salad', emoji: '🥗', health: 2 },
  { seedKey: 'vegetables', name: 'Vegetables', emoji: '🥦', health: 2 },
  { seedKey: 'fruit', name: 'Fruit', emoji: '🍎', health: 2 },
  { seedKey: 'fish', name: 'Fish', emoji: '🐟', health: 2 },
  { seedKey: 'grilled_chicken', name: 'Grilled chicken', emoji: '🍗', health: 2 },
  { seedKey: 'eggs', name: 'Eggs', emoji: '🥚', health: 2 },
  { seedKey: 'oatmeal', name: 'Oatmeal', emoji: '🥣', health: 2 },
  { seedKey: 'yogurt', name: 'Yogurt', emoji: '🥛', health: 2 },
  { seedKey: 'nuts', name: 'Nuts', emoji: '🥜', health: 2 },
  { seedKey: 'legumes', name: 'Beans & lentils', emoji: '🫘', health: 2 },

  { seedKey: 'pasta', name: 'Pasta', emoji: '🍝', health: 1 },
  { seedKey: 'rice', name: 'Rice', emoji: '🍚', health: 1 },
  { seedKey: 'bread', name: 'Bread', emoji: '🍞', health: 1 },
  { seedKey: 'sandwich', name: 'Sandwich', emoji: '🥪', health: 1 },
  { seedKey: 'cheese', name: 'Cheese', emoji: '🧀', health: 1 },
  { seedKey: 'red_meat', name: 'Red meat', emoji: '🥩', health: 1 },
  { seedKey: 'potatoes', name: 'Potatoes', emoji: '🥔', health: 1 },
  { seedKey: 'sweet_coffee', name: 'Coffee with sugar', emoji: '☕', health: 1 },

  { seedKey: 'pizza', name: 'Pizza', emoji: '🍕', health: 0 },
  { seedKey: 'ice_cream', name: 'Ice cream', emoji: '🍦', health: 0 },
  { seedKey: 'burger', name: 'Burger', emoji: '🍔', health: 0 },
  { seedKey: 'fries', name: 'Fries', emoji: '🍟', health: 0 },
  { seedKey: 'chips', name: 'Chips', emoji: '🥔', health: 0 },
  { seedKey: 'sweets', name: 'Sweets & chocolate', emoji: '🍫', health: 0 },
  { seedKey: 'soda', name: 'Soda', emoji: '🥤', health: 0 },
  { seedKey: 'cake', name: 'Cake & pastry', emoji: '🍰', health: 0 },
  { seedKey: 'alcohol', name: 'Alcohol', emoji: '🍺', health: 0 },
];
