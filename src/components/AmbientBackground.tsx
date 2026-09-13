import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { colors } from '@/theme';

// Soft color fields behind the UI; glass needs something to refract.
// Kept in blue/violet so they never compete with the green/orange/red health colors.
const BLOBS = [
  { id: 'a', color: '#4655FF', x: 0.05, y: 0.1, r: 0.95, opacity: 0.5 },
  { id: 'b', color: '#9A4DFF', x: 1.0, y: 0.38, r: 0.85, opacity: 0.38 },
  { id: 'c', color: '#1E8BFF', x: 0.1, y: 0.82, r: 0.9, opacity: 0.3 },
  { id: 'd', color: '#E04DFF', x: 0.95, y: 1.0, r: 0.75, opacity: 0.2 },
];

export function AmbientBackground() {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}>
      <Svg width={width} height={height}>
        <Defs>
          {BLOBS.map((b) => (
            <RadialGradient key={b.id} id={b.id} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={b.color} stopOpacity={b.opacity} />
              <Stop offset="0.55" stopColor={b.color} stopOpacity={b.opacity * 0.35} />
              <Stop offset="1" stopColor={b.color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>
        {BLOBS.map((b) => (
          <Circle key={b.id} cx={b.x * width} cy={b.y * height} r={b.r * width} fill={`url(#${b.id})`} />
        ))}
      </Svg>
    </View>
  );
}
