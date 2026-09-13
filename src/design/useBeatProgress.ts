import { useEffect } from 'react';
import { Easing, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import { useReducedMotion } from '@/design/a11y';

/**
 * Reloj del arranque, entre 0 y 1.
 *
 * Vive en el hilo de UI como valor compartido: Skia acepta valores animados de
 * Reanimated directamente en sus props, asi que la escena avanza sin pasar por
 * React ni provocar un render por fotograma.
 *
 * LINEAL, NO CON LA CURVA DE LA APLICACION. Esto no es una transicion sino el
 * reloj de un guion: cada capa aplica su propia curva en `heartTimeline.ts`, y el
 * trazo tiene que avanzar a velocidad constante para que los latidos caigan
 * cuando la pluma pasa por el QRS y por la onda T. Con la curva del sistema el
 * reloj llegaba al 90 % en un tercio del tiempo.
 *
 * Con movimiento reducido arranca y se queda en 1: la escena aparece completa y
 * en reposo, nunca acortada (§11).
 *
 * @param durationMs Duracion del guion en milisegundos.
 * @returns El valor compartido con el reloj.
 */
export function useBeatProgress(durationMs: number): SharedValue<number> {
  const isReducedMotion = useReducedMotion();
  const progress = useSharedValue(isReducedMotion ? 1 : 0);

  useEffect(() => {
    if (isReducedMotion) {
      progress.value = 1;
      return;
    }
    progress.value = withTiming(1, { duration: durationMs, easing: Easing.linear });
  }, [durationMs, isReducedMotion, progress]);

  return progress;
}
