import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import type { Rect } from '@/camera/framing';
import { isConvexQuad, rectToQuad, type Point, type Quad } from '@/camera/quad';

/** Las cuatro esquinas como valores compartidos, en el orden del contrato de Quad. */
export type CornerValues = readonly [
  SharedValue<Point>,
  SharedValue<Point>,
  SharedValue<Point>,
  SharedValue<Point>,
];

/**
 * Las cuatro esquinas del recorte, vivas en el hilo de UI.
 *
 * Cada esquina es un valor compartido y no estado de React. Durante un arrastre
 * cambian a la frecuencia de refresco de la pantalla: como estado provocarian
 * sesenta renderizados por segundo de una pantalla que contiene una fotografia
 * a resolucion plena.
 *
 * Lo unico que cruza al hilo de JavaScript es si el cuadrilatero se ha cruzado
 * sobre si mismo, y solo cuando esa respuesta cambia.
 */
export interface QuadCorners {
  readonly corners: CornerValues;
  /**
   * Falso mientras las esquinas formen una corbata de lazo.
   *
   * Se calcula en el hilo de UI y solo se avisa al de JavaScript cuando cambia,
   * para no cruzar el puente en cada fotograma del arrastre.
   */
  readonly isValid: boolean;
  /** Devuelve el cuadrilatero actual como valor corriente. */
  readonly read: () => Quad;
  /** Devuelve las esquinas al rectangulo de partida. */
  readonly reset: () => void;
}

/**
 * Coloca las cuatro esquinas sobre un rectangulo.
 *
 * Vive fuera del gancho porque escribe sobre valores compartidos: dentro de un
 * useCallback, el analisis de React lo lee como una mutacion durante el
 * renderizado y avisa con razon, aunque aqui solo se invoque desde efectos y
 * manejadores.
 *
 * @param corners Las cuatro esquinas.
 * @param rect Rectangulo de destino.
 */
function placeCorners(corners: CornerValues, rect: Rect): void {
  const [r0, r1, r2, r3] = rectToQuad(rect);
  const [topLeft, topRight, bottomRight, bottomLeft] = corners;

  topLeft.value = r0;
  topRight.value = r1;
  bottomRight.value = r2;
  bottomLeft.value = r3;
}

/**
 * Gobierna las cuatro esquinas arrastrables.
 *
 * @param initial Rectangulo de partida, normalmente el marco que se encuadro.
 * @returns Las esquinas, su validez y las acciones para leerlas y reiniciarlas.
 */
export function useQuadCorners(initial: Rect): QuadCorners {
  const [q0, q1, q2, q3] = rectToQuad(initial);

  const topLeft = useSharedValue<Point>(q0);
  const topRight = useSharedValue<Point>(q1);
  const bottomRight = useSharedValue<Point>(q2);
  const bottomLeft = useSharedValue<Point>(q3);
  const [isValid, setIsValid] = useState(true);

  const corners: CornerValues = useMemo(
    () => [topLeft, topRight, bottomRight, bottomLeft],
    [topLeft, topRight, bottomRight, bottomLeft],
  );

  // El rectangulo de partida solo se conoce cuando la imagen ya se ha medido,
  // asi que llega despues del primer render y hay que colocar las esquinas
  // entonces. Se escribe sobre los valores compartidos, no sobre estado, de
  // modo que esto no provoca un segundo renderizado.
  useEffect(() => placeCorners(corners, initial), [corners, initial]);

  useAnimatedReaction(
    () => isConvexQuad([topLeft.value, topRight.value, bottomRight.value, bottomLeft.value]),
    (isConvex, previous) => {
      if (previous !== null && isConvex !== previous) {
        runOnJS(setIsValid)(isConvex);
      }
    },
  );

  const read = useCallback(
    (): Quad => [topLeft.value, topRight.value, bottomRight.value, bottomLeft.value],
    [topLeft, topRight, bottomRight, bottomLeft],
  );

  const reset = useCallback(() => {
    placeCorners(corners, initial);
    setIsValid(true);
  }, [corners, initial]);

  return { corners, isValid, read, reset };
}
