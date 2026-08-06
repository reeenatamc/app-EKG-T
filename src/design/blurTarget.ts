import { createContext, useContext, type RefObject } from 'react';
import type { View } from 'react-native';

export type BlurTargetRef = RefObject<View | null> | null;

/**
 * Referencia a la vista que el vidrio debe desenfocar.
 *
 * En Android, expo-blur no desenfoca "lo que haya detras": exige designar de
 * forma explicita una vista objetivo mediante BlurTargetView. Sin ella, el
 * metodo dimezisBlurView cae en silencio a "none" y el vidrio deja de
 * desenfocar, aunque siga pintando su tinte.
 *
 * Background publica aqui la referencia de sus capas de fondo, y Glass la
 * consume. Asi ningun componente de vidrio necesita saber donde esta el fondo.
 */
export const BlurTargetContext = createContext<BlurTargetRef>(null);

/**
 * Devuelve la vista objetivo del desenfoque de la pantalla actual.
 *
 * @returns La referencia al objetivo, o null si no hay Background por encima.
 */
export function useBlurTarget(): BlurTargetRef {
  return useContext(BlurTargetContext);
}
