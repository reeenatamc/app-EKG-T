import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { useFonts } from 'expo-font';
import { useEffect } from 'react';

/** Una familia compartida; los roles conservan la jerarquía de la información. */
export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
} as const;
export const type = {
  display: {
    fontFamily: font.semibold,
    fontSize: 44,
    lineHeight: 42,
    letterSpacing: -1.3,
  },
  headline: {
    fontFamily: font.semibold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  section: { fontFamily: font.semibold, fontSize: 18, lineHeight: 24 },
  h1: { fontFamily: font.medium, fontSize: 24, lineHeight: 30 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24 },
  caption: { fontFamily: font.regular, fontSize: 13, lineHeight: 18 },
  /** Etiquetas auxiliares, con la misma familia que el resto de la interfaz. */
  eyebrow: {
    fontFamily: font.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  vital: {
    fontFamily: font.semibold,
    fontSize: 64,
    lineHeight: 64,
    letterSpacing: -1,
  },
  data: { fontFamily: font.regular, fontSize: 15, lineHeight: 20 },
  /** Recuentos administrativos del inicio, no mediciones clínicas. */
  figure: {
    fontFamily: font.semibold,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
} as const;

/**
 * Carga las fuentes de la aplicacion.
 *
 * No libera el splash: de eso se ocupa useAppReady, que ademas espera a que las
 * preferencias esten hidratadas. Soltarlo aqui pintaria un fotograma con el
 * tema por defecto antes de saber cual quiere el usuario.
 *
 * Si la carga falla se continua igualmente con las fuentes del sistema: una
 * aplicacion clinica atascada en el splash por un problema tipografico seria
 * peor fallo que una tipografia distinta.
 *
 * @returns Cierto cuando las fuentes estan disponibles.
 */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (error !== null) {
      console.warn('[type] las fuentes no cargaron; se usan las del sistema', error);
    }
  }, [error]);

  return loaded || error !== null;
}
