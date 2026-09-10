import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  runOnJS,
  useAnimatedReaction,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';

import { sameRect, type Rect } from '@/camera/framing';
import {
  isConvexQuad,
  rectToQuad,
  remapPointBetweenRects,
  type Point,
  type Quad,
} from '@/camera/quad';

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
 * Lleva las esquinas de un rectangulo al equivalente en otro.
 *
 * @param corners Las cuatro esquinas.
 * @param from Rectangulo en el que estan expresadas.
 * @param to Rectangulo nuevo.
 */
function remapCorners(corners: CornerValues, from: Rect, to: Rect): void {
  for (const corner of corners) {
    corner.value = remapPointBetweenRects(corner.value, from, to);
  }
}

/**
 * Mantiene las esquinas en su sitio cuando el rectangulo de partida cambia.
 *
 * La primera vez las coloca sobre el marco encuadrado: el rectangulo solo se
 * conoce cuando la imagen ya se ha medido, asi que llega despues del primer
 * render. DESPUES YA NO LAS COLOCA, LAS LLEVA. Un ajuste hecho a mano no se tira
 * porque la pantalla se haya redistribuido.
 *
 * Esto no era una mejora, era el fallo. Al soltar una esquina se recalculaba la
 * previa enderezada; la previa cambia de alto segun la forma del recorte; eso
 * cambiaba el alto del area de la foto, que se vuelve a medir; y con la medida
 * nueva las esquinas saltaban al marco de partida mientras la previa seguia
 * mostrando el recorte arrastrado. En pantalla se ve como que el recorte se
 * reinicia solo y la previa sale torcida.
 *
 * Una medida identica no cuenta como cambio, aunque llegue en un objeto nuevo,
 * que es lo normal al medir. Y girar el telefono, que si cambia el rectangulo de
 * verdad, ahora conserva el recorte en vez de deshacerlo.
 *
 * @param corners Las cuatro esquinas.
 * @param initial Rectangulo de partida, en puntos de pantalla.
 * @returns Funcion que las devuelve al marco de partida, para el boton de reiniciar.
 */
function usePlacement(corners: CornerValues, initial: Rect): () => void {
  const placed = useRef<Rect | null>(null);

  const place = useCallback(() => {
    placed.current = initial;
    placeCorners(corners, initial);
  }, [corners, initial]);

  useEffect(() => {
    // Antes de la primera medida el rectangulo no tiene area y no hay donde
    // colocarlas. Saltarselo tambien mantiene la invariante de la que depende lo
    // de abajo: en `placed` nunca hay un rectangulo sin area, del que no se
    // podria salir por proporcion.
    if (initial.width === 0 || initial.height === 0) {
      return;
    }

    const previous = placed.current;
    if (sameRect(previous, initial)) {
      return;
    }

    placed.current = initial;
    if (previous === null) {
      placeCorners(corners, initial);
      return;
    }
    remapCorners(corners, previous, initial);
  }, [corners, initial]);

  return place;
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

  const place = usePlacement(corners, initial);

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
    place();
    setIsValid(true);
  }, [place]);

  return { corners, isValid, read, reset };
}
