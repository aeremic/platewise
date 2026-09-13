import type { HealthLevel } from '@/domain/health';

export const colors = {
  background: '#05060A',
  sheetBackground: '#10121A',
  text: '#F5F7FF',
  textSecondary: 'rgba(235, 240, 255, 0.64)',
  textTertiary: 'rgba(235, 240, 255, 0.38)',
  hairline: 'rgba(255, 255, 255, 0.14)',
  glassFill: 'rgba(255, 255, 255, 0.07)',
  pressedFill: 'rgba(255, 255, 255, 0.12)',
  accent: '#8C9EFF',
  destructive: '#FF453A',
  health: {
    2: '#30D158',
    1: '#FF9F0A',
    0: '#FF453A',
  } satisfies Record<HealthLevel, string>,
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 12, md: 18, lg: 28, pill: 999 };

export const type = {
  largeTitle: { fontSize: 34, fontWeight: '700', letterSpacing: 0.3 },
  title: { fontSize: 22, fontWeight: '700' },
  headline: { fontSize: 17, fontWeight: '600' },
  body: { fontSize: 16, fontWeight: '400' },
  caption: { fontSize: 13, fontWeight: '500' },
  overline: { fontSize: 12, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
} as const;

/** '#RRGGBB' + alpha → 'rgba(...)'. */
export function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

export function healthColor(level: HealthLevel): string {
  return colors.health[level];
}
