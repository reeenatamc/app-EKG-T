import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { paperDark, paperLight } from '@/design/tokens';
import { useSettings, type ThemeMode } from '@/state/settings';

export interface Theme {
  readonly mode: ThemeMode;
  /** Lienzo de la capa 0. Nunca blanco ni negro puros. */
  readonly canvas: string;
  /**
   * Lienzo de las pantallas sin atmosfera (D-20).
   *
   * En claro es hueso puro, porque un lienzo plano no sostiene ninguna malla y no
   * tiene por que estar en sombra. En oscuro coincide con `canvas`.
   */
  readonly canvasFlat: string;
  /** Superficie opaca. Toda cifra clinica se apoya aqui, jamas en vidrio. */
  readonly surface: string;
  /** Color del trazado digitalizado. Se invierte con el tema. */
  readonly ink: string;
  /**
   * Filo de una superficie opaca.
   *
   * Existe porque sin el la forma de una tarjeta la dibujaba el fondo: el par
   * lienzo/superficie medido daba 1.04:1 en claro. Toda superficie opaca lleva
   * un pelo de este color.
   */
  readonly edge: string;
  readonly textHigh: string;
  readonly textLow: string;
  readonly gridFine: string;
  /** Retícula gruesa y filos de apoyo. No es acento de marca. */
  readonly gridBold: string;
  /**
   * Color del latido difuso de la capa 2.
   *
   * Se invierte con el tema: sombra sobre hueso, resplandor sobre ciruela. Antes
   * usaba los mismos tres colores que los blobs que tiene detras, asi que el
   * elemento firma del sistema estaba pintado del color de su propio fondo.
   */
  readonly bloom: string;
  /**
   * Opacidad de los blobs del aurora.
   *
   * Baja en los dos temas. En la lamina de contacto de D.1 el aurora era el
   * elemento mas fuerte de las doce pantallas y le ganaba al contenido: la
   * aplicacion se leia como un fondo de pantalla con una interfaz encima. La
   * atmosfera va detras del contenido o no es atmosfera.
   */
  readonly auroraOpacity: number;
}

const DARK_AURORA_OPACITY = 0.5;
const LIGHT_AURORA_OPACITY = 0.42;

const ThemeContext = createContext<Theme | null>(null);

function buildTheme(mode: ThemeMode): Theme {
  const palette = mode === 'dark' ? paperDark : paperLight;

  return {
    mode,
    canvas: palette.canvas,
    canvasFlat: palette.canvasFlat,
    surface: palette.surface,
    ink: palette.ink,
    edge: palette.edge,
    textHigh: palette.textHigh,
    textLow: palette.textLow,
    gridFine: palette.gridFine,
    gridBold: palette.gridBold,
    bloom: palette.bloom,
    auroraOpacity: mode === 'dark' ? DARK_AURORA_OPACITY : LIGHT_AURORA_OPACITY,
  };
}

interface ThemeProviderProps {
  readonly children: ReactNode;
}

/**
 * Provee el tema resuelto a todo el arbol.
 *
 * Cambiar de tema no remonta nada: solo cambia el valor del contexto, asi que
 * el estado de las pantallas y las capturas en curso sobreviven al cambio.
 *
 * @param children Arbol que consume el tema.
 * @returns El proveedor de tema.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const preference = useSettings((state) => state.mode);
  const systemScheme = useColorScheme();
  const mode: ThemeMode = preference ?? (systemScheme === 'dark' ? 'dark' : 'light');
  const theme = useMemo(() => buildTheme(mode), [mode]);

  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

/**
 * Devuelve el tema activo.
 *
 * @returns El tema resuelto para el modo actual.
 * @throws {Error} Si se invoca fuera de ThemeProvider.
 */
export function useTheme(): Theme {
  const theme = useContext(ThemeContext);

  if (theme === null) {
    throw new Error('useTheme requiere que el arbol este envuelto en ThemeProvider.');
  }

  return theme;
}
