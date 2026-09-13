import { SymbolView, type SymbolViewProps } from 'expo-symbols';

import { colors } from '@/theme';

type Props = {
  /** SF Symbol name (iOS). */
  ios: Extract<SymbolViewProps['name'], string>;
  /** Material Symbol name (Android). */
  android: string;
  size?: number;
  color?: string;
};

export function Icon({ ios, android, size = 20, color = colors.text }: Props) {
  return (
    <SymbolView
      name={{ ios, android, web: android } as SymbolViewProps['name']}
      size={size}
      tintColor={color}
    />
  );
}
