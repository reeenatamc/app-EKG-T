import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gesture, type PanGesture } from 'react-native-gesture-handler';
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/design/a11y';
import { timing } from '@/design/motion';
import { motion } from '@/design/tokens';
import { SHEET_DRAG_SLOP, shouldOpenSheet } from '@/shell/sheetSnap';

export interface BottomSheetControl {
  readonly isOpen: boolean;
  readonly open: () => void;
  readonly close: () => void;
  readonly toggle: () => void;
  /** Arrastre de la barrita y las pestanas. */
  readonly pan: PanGesture;
  /** Desplazamiento animado de la hoja. */
  readonly style: ReturnType<typeof useAnimatedStyle>;
}

/**
 * Estado y movimiento de una hoja inferior.
 *
 * HECHA A MANO Y NO CON UNA LIBRERIA. Gesture-handler y Reanimated ya estan
 * compilados, y lo que hace falta aqui son dos posiciones, un arrastre y un toque.
 * Una hoja de terceros traeria puntos intermedios, teclado y listas virtualizadas
 * que esta pantalla no usa, y su accesibilidad no se controla desde fuera: aqui el
 * estado abierto es un booleano de React que las pestanas y la barrita anuncian.
 *
 * EL ARRASTRE CORRE EN EL HILO DE INTERFAZ y la decision al soltar en el de
 * JavaScript, con `shouldOpenSheet`, que es pura y esta probada.
 *
 * SIN MUELLE. Una curva que llega y se para; con movimiento reducido la hoja salta
 * a su sitio sin animar (§11).
 *
 * @param closedOffset Desplazamiento de la hoja cerrada.
 * @returns El control de la hoja.
 */
export function useBottomSheet(closedOffset: number): BottomSheetControl {
  const reduceMotion = useReducedMotion();
  const [isOpen, setIsOpen] = useState(false);
  const offset = useSharedValue(closedOffset);
  const dragStart = useSharedValue(0);

  useEffect(() => {
    moveSheet(offset, isOpen ? 0 : closedOffset, reduceMotion);
  }, [offset, isOpen, closedOffset, reduceMotion]);

  const settle = useCallback(
    (end: number, velocityY: number) => {
      const next = shouldOpenSheet(end, velocityY, closedOffset);
      setIsOpen(next);
      // Si el estado no cambia el efecto no se repite, y la hoja se quedaria
      // donde se solto. Se lleva a su sitio aqui tambien.
      moveSheet(offset, next ? 0 : closedOffset, reduceMotion);
    },
    [offset, closedOffset, reduceMotion],
  );

  const pan = useMemo(
    () => createSheetPan(offset, dragStart, closedOffset, settle),
    [offset, dragStart, closedOffset, settle],
  );
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: offset.value }] }));

  return {
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    toggle: () => setIsOpen((open) => !open),
    pan,
    style,
  };
}

/**
 * Lleva la hoja a su sitio.
 *
 * FUERA DEL GANCHO, como `settle` en `usePressMotion`: asignar a un valor
 * compartido dentro de un gancho lo denuncia `react-hooks/immutability`.
 *
 * @param offset Desplazamiento compartido.
 * @param target Destino.
 * @param reduceMotion Cierto para saltar sin animar.
 */
function moveSheet(offset: SharedValue<number>, target: number, reduceMotion: boolean): void {
  offset.value = reduceMotion ? target : withTiming(target, timing(motion.card));
}

/**
 * El arrastre vertical de la hoja.
 *
 * El confinamiento va escrito dentro del worklet y no llamando a otro modulo: el
 * complemento de compilacion no arrastra funciones ajenas al hilo de interfaz.
 * Ver `createCornerGesture`.
 *
 * `activeOffsetY` deja pasar el toque: por debajo de ese recorrido el dedo es un
 * toque de pestana, no un arrastre.
 */
function createSheetPan(
  offset: SharedValue<number>,
  dragStart: SharedValue<number>,
  closedOffset: number,
  settle: (end: number, velocityY: number) => void,
): PanGesture {
  return Gesture.Pan()
    .activeOffsetY([-SHEET_DRAG_SLOP, SHEET_DRAG_SLOP])
    .onStart(() => {
      'worklet';
      dragStart.value = offset.value;
    })
    .onChange((event) => {
      'worklet';
      offset.value = Math.min(Math.max(dragStart.value + event.translationY, 0), closedOffset);
    })
    .onEnd((event) => {
      'worklet';
      runOnJS(settle)(offset.value, event.velocityY);
    });
}
