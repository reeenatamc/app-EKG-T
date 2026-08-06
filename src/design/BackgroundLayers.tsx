import { Canvas } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

import { AmbientGrid } from '@/design/AmbientGrid';
import { AuroraLayer } from '@/design/Aurora';
import { SignalBloomLayer } from '@/design/SignalBloom';
import { useTheme } from '@/design/theme';

interface BackgroundLayersProps {
  readonly width: number;
  readonly height: number;
  readonly showSignalBloom: boolean;
}

/**
 * Capas 1 a 3 de SKILL.md §1 dentro de un unico lienzo Skia.
 *
 * El lienzo es uno por pantalla, nunca uno por tarjeta. Queda fuera del arbol
 * de accesibilidad y no intercepta toques: es decoracion, y un lector de
 * pantalla no debe recorrerla.
 *
 * @param width Ancho del lienzo en puntos.
 * @param height Alto del lienzo en puntos.
 * @param showSignalBloom Falso para omitir la capa 2.
 * @returns El lienzo con sus capas.
 */
export function BackgroundLayers({ width, height, showSignalBloom }: BackgroundLayersProps) {
  const theme = useTheme();

  return (
    <Canvas
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <AuroraLayer width={width} height={height} opacity={theme.auroraOpacity} />
      {showSignalBloom ? (
        <SignalBloomLayer width={width} height={height} color={theme.bloom} />
      ) : null}
      <AmbientGrid width={width} height={height} color={theme.gridFine} />
    </Canvas>
  );
}
