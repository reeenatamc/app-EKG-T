import { useEffect } from 'react';
import { useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { useReducedMotion } from '@/design/a11y';
import { timing } from '@/design/motion';

/**
 * Avance del trazo del latido, entre 0 y 1.
 *
 * Vive en el hilo de UI como valor compartido: Skia acepta valores animados de
 * Reanimated directamente en sus props, asi que el trazo avanza sin pasar por
 * React ni provocar un render por fotograma.
 *
 * Con movimiento reducido arranca y se queda en 1: el latido aparece completo y
 * estatico, nunca acortado (§11).
 *
 * @param durationMs Duracion del trazo en milisegundos.
 * @returns El valor compartido con el avance del trazo.
 */
export function useBeatProgress(durationMs: number): SharedValue<number> {
  const isReducedMotion = useReducedMotion();
  const progress = useSharedValue(isReducedMotion ? 1 : 0);

  useEffect(() => {
    if (isReducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, timing(durationMs));
  }, [durationMs, isReducedMotion, progress]);

  return progress;
}
