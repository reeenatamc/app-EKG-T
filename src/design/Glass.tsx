import { BlurView } from 'expo-blur';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedTransparency } from '@/design/a11y';
import { useBlurTarget } from '@/design/blurTarget';
import { useTheme } from '@/design/theme';
import { blur, glass, radius, size } from '@/design/tokens';

const ANDROID_ELEVATION = 6;

interface GlassSurfaceProps {
  readonly children: ReactNode;
  readonly intensity: number;
  readonly cornerRadius: number;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Base compartida por GlassCard y GlassChrome.
 *
 * Cae a superficie opaca cuando la transparencia reducida esta activa. La
 * caida no es cosmetica: §12.6 exige que la jerarquia sobreviva sin vidrio.
 */
function GlassSurface({ children, intensity, cornerRadius, style }: GlassSurfaceProps) {
  const theme = useTheme();
  const isFlat = useReducedTransparency();
  const blurTarget = useBlurTarget();
  const isDark = theme.mode === 'dark';
  const base = [styles.base, { borderRadius: cornerRadius }];

  if (isFlat) {
    const flat = { backgroundColor: theme.surface, borderColor: theme.gridBold };
    return <View style={[base, flat, style]}>{children}</View>;
  }

  return (
    <BlurView
      intensity={intensity}
      tint={isDark ? 'dark' : 'light'}
      // En Android el desenfoque no ocurre sin metodo y sin objetivo: expo-blur
      // cae a "none" en silencio y el vidrio se queda en un tinte plano.
      blurMethod={Platform.OS === 'android' ? 'dimezisBlurView' : undefined}
      blurTarget={blurTarget ?? undefined}
      style={[base, { borderColor: isDark ? glass.borderDark : glass.borderLight }, style]}
    >
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: isDark ? glass.tintDark : glass.tintLight },
        ]}
      />
      <View pointerEvents="none" style={styles.specular} />
      {children}
    </BlurView>
  );
}

interface GlassProps {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Tarjeta de vidrio para contenido de contexto.
 *
 * Jamas para cifras clinicas: §12.1 las exige sobre superficie opaca.
 *
 * @param children Contenido de la tarjeta.
 * @param style Estilos adicionales del contenedor.
 * @returns La tarjeta de vidrio, u opaca si la transparencia esta reducida.
 */
export function GlassCard({ children, style }: GlassProps) {
  return (
    <GlassSurface intensity={blur.card} cornerRadius={radius.card} style={style}>
      {children}
    </GlassSurface>
  );
}

/**
 * Vidrio del chrome flotante: barra de pestanas, cabeceras, pildoras.
 *
 * Mas intenso que la tarjeta porque flota sobre contenido en movimiento y
 * necesita separarse de el.
 *
 * @param children Contenido del chrome.
 * @param style Estilos adicionales del contenedor.
 * @returns El chrome de vidrio, u opaco si la transparencia esta reducida.
 */
export function GlassChrome({ children, style }: GlassProps) {
  return (
    <GlassSurface intensity={blur.chrome} cornerRadius={radius.pill} style={style}>
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  base: {
    // Sin overflow oculto, Android dibuja el desenfoque cuadrado bajo la
    // esquina redondeada.
    overflow: 'hidden',
    borderWidth: size.hairline,
    borderCurve: 'continuous',
    ...Platform.select({
      ios: {
        shadowColor: glass.shadow,
        shadowOpacity: 0.1,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: ANDROID_ELEVATION },
    }),
  },
  // Luz especular desde arriba. Una sola direccion de luz en toda la app.
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: size.hairline,
    backgroundColor: glass.specular,
  },
});
