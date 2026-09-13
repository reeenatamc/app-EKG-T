import { BlurView, type BlurTint } from 'expo-blur';
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import type { ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { useReducedTransparency } from '@/design/a11y';
import { useBlurTarget } from '@/design/blurTarget';
import { useTheme } from '@/design/theme';
import { blur, glass, radius, size } from '@/design/tokens';

const ANDROID_ELEVATION = 6;

/**
 * Lo que tarda el vidrio nativo en aparecer o apagarse, en segundos (la unidad de
 * `animationDuration`). Igual que el fundido entre pestanas de expo-router, 150 ms,
 * para que el material entre a la vez que la pantalla.
 */
const LIQUID_FADE_SECONDS = 0.15;

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
      tint={blurTint(isDark)}
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
      {children}
    </BlurView>
  );
}

/**
 * Material del desenfoque.
 *
 * En iOS el material nativo ultrafino, que es el que usa el sistema en sus barras.
 * Android no tiene materiales: solo claro u oscuro.
 *
 * @param isDark Cierto en el tema oscuro.
 * @returns El tinte para `BlurView`.
 */
function blurTint(isDark: boolean): BlurTint {
  if (Platform.OS === 'ios') {
    return isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight';
  }
  return isDark ? 'dark' : 'light';
}

/**
 * Cierto si el sistema dibuja Liquid Glass de verdad.
 *
 * Solo iOS 26 o posterior, y comprobando tambien la API: segun la documentacion de
 * expo-glass-effect, algunas betas de iOS 26 anuncian el componente sin tenerla y se
 * cierran al montarlo. Se consulta al renderizar y no a nivel de modulo, para no
 * tocar el modulo nativo al importar este archivo.
 *
 * @returns Cierto si se puede usar `GlassView`.
 */
function hasLiquidGlass(): boolean {
  return isLiquidGlassAvailable() && isGlassEffectAPIAvailable();
}

interface LiquidGlassSurfaceProps {
  readonly children: ReactNode;
  readonly cornerRadius: number;
  /** Falso mientras su pantalla esta oculta. Ver la nota sobre la opacidad. */
  readonly visible: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

/**
 * Liquid Glass nativo de iOS 26.
 *
 * Es el material del sistema: refracta y refleja lo que pasa por debajo, reacciona al
 * toque y dibuja su propio filo y su propio brillo, asi que aqui no se pinta tinte
 * ni borde. Apple lo reserva para la capa de navegacion que flota sobre el
 * contenido y desaconseja vidrio sobre vidrio; por eso solo lo usa `GlassChrome`,
 * nunca una tarjeta de contenido (D-26).
 *
 * NO SOBREVIVE A LA OPACIDAD CERO. Si el material o un padre pasan por opacidad 0
 * deja de dibujarse, y las pestanas se cruzan con un fundido que deja en 0 las que
 * no estan activas. La salida es la que documenta expo-glass-effect: apagar el
 * estilo mientras la pantalla esta oculta y encenderlo con su animacion nativa al
 * volver, en lugar de tocar la opacidad.
 *
 * @param children Contenido del chrome.
 * @param cornerRadius Radio de la forma, que el material toma del borde.
 * @param visible Falso mientras su pantalla esta oculta.
 * @param style Estilos adicionales del contenedor.
 * @returns El vidrio nativo.
 */
function LiquidGlassSurface({ children, cornerRadius, visible, style }: LiquidGlassSurfaceProps) {
  const theme = useTheme();

  return (
    <GlassView
      glassEffectStyle={{
        style: visible ? 'regular' : 'none',
        animate: true,
        animationDuration: LIQUID_FADE_SECONDS,
      }}
      isInteractive
      colorScheme={theme.mode === 'dark' ? 'dark' : 'light'}
      style={[styles.liquid, { borderRadius: cornerRadius }, style]}
    >
      {children}
    </GlassView>
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

interface GlassChromeProps extends GlassProps {
  /**
   * Falso mientras la pantalla que lo contiene esta oculta. Solo lo necesita el
   * vidrio nativo; el desenfoque de expo-blur no tiene ese problema.
   */
  readonly visible?: boolean;
}

/**
 * Vidrio del chrome flotante: barra de pestanas, cabeceras, pildoras.
 *
 * Mas intenso que la tarjeta porque flota sobre contenido en movimiento y
 * necesita separarse de el.
 *
 * EN iOS 26 ES LIQUID GLASS NATIVO, con el desenfoque de expo-blur como respaldo en
 * Android y en iOS anteriores. Con la transparencia reducida, opaco en todos.
 *
 * @param children Contenido del chrome.
 * @param visible Falso mientras su pantalla esta oculta.
 * @param style Estilos adicionales del contenedor.
 * @returns El chrome de vidrio, u opaco si la transparencia esta reducida.
 */
export function GlassChrome({ children, visible = true, style }: GlassChromeProps) {
  const isFlat = useReducedTransparency();

  if (!isFlat && hasLiquidGlass()) {
    return (
      <LiquidGlassSurface cornerRadius={radius.pill} visible={visible} style={style}>
        {children}
      </LiquidGlassSurface>
    );
  }

  return (
    <GlassSurface intensity={blur.chrome} cornerRadius={radius.pill} style={style}>
      {children}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  liquid: { borderCurve: 'continuous' },
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
});
