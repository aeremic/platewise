/** 0 = red (unhealthy), 1 = orange (moderate), 2 = green (healthy). */
export type HealthLevel = 0 | 1 | 2;

export const HEALTH_LEVELS: readonly HealthLevel[] = [2, 1, 0];

export const HEALTH_LABELS: Record<HealthLevel, string> = {
  2: 'Healthy',
  1: 'Moderate',
  0: 'Unhealthy',
};

const GREEN_MIN = 1.5;
const ORANGE_MIN = 0.75;

/**
 * Maps an average health score (0–2) to a color level.
 * Used by `rateDay` (src/domain/dayRating.ts), which the calendar and statistics share.
 */
export function levelFromAverage(average: number | null | undefined): HealthLevel | null {
  if (average == null || Number.isNaN(average)) return null;
  if (average >= GREEN_MIN) return 2;
  if (average >= ORANGE_MIN) return 1;
  return 0;
}
