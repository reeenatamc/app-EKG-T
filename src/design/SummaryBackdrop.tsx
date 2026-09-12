import { Canvas, RadialGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

import { useReducedTransparency } from '@/design/a11y';
import { useTheme } from '@/design/theme';
import { gap, radius, summaryTiles } from '@/design/tokens';

interface SummaryBackdropProps {
  readonly width: number;
  readonly height: number;
  readonly count: number;
}

/** Fondo decorativo opaco: el difuminado es de color, nunca de las cifras. */
export function SummaryBackdrop({ width, height, count }: SummaryBackdropProps) {
  const theme = useTheme();
  const flat = useReducedTransparency();
  const colors = summaryTiles[theme.mode === 'dark' ? 'dark' : 'light'];
  const tileWidth = Math.max(0, (width - gap.md * (count - 1)) / Math.max(count, 1));

  return (
    <Canvas
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {Array.from({ length: count }, (_, index) => (
        <SummaryWash
          key={index}
          colors={colors}
          x={index * (tileWidth + gap.md)}
          width={tileWidth}
          height={height}
          flat={flat}
        />
      ))}
    </Canvas>
  );
}

interface SummaryWashProps {
  readonly colors: readonly [string, string];
  readonly x: number;
  readonly width: number;
  readonly height: number;
  readonly flat: boolean;
}

function SummaryWash({ colors, x, width, height, flat }: SummaryWashProps) {
  return (
    <RoundedRect x={x} y={0} width={width} height={height} r={radius.tile} color={colors[1]}>
      {flat ? null : (
        <RadialGradient
          c={vec(x + width, height)}
          r={Math.max(width, height, 1)}
          colors={[...colors]}
        />
      )}
    </RoundedRect>
  );
}
