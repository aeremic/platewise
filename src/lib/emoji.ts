/** Shown wherever a category has no emoji of its own. */
export const FALLBACK_EMOJI = '🍽️';

/**
 * Quick picks in the category editor (3 rows of 8), so choosing an emoji doesn't require the
 * emoji keyboard. Any other emoji can still be typed into the emoji field.
 */
export const FOOD_EMOJIS = [
  '🍽️', '🥗', '🥦', '🍎', '🍓', '🥑', '🍞', '🧀',
  '🥚', '🍗', '🥩', '🐟', '🍣', '🍝', '🍚', '🌯',
  '🥪', '🍔', '🍕', '🍟', '🍰', '🍫', '☕', '🍺',
];

export function categoryEmoji(emoji: string | null | undefined): string {
  return emoji || FALLBACK_EMOJI;
}
