import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { runOnJS, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import type { BootDestination } from '@/auth/useBootDestination';
import { useReducedMotion } from '@/design/a11y';
import { timing } from '@/design/motion';
import { motion } from '@/design/tokens';

/**
 * Salida del splash hacia su destino.
 *
 * La animacion **nunca bloquea**: en cuanto se conoce el destino se empieza a
 * salir. Si el latido no llego al final no se corta, se desvanece durante la
 * transicion. Un electrocardiograma truncado a mitad del QRS no puede ser la
 * primera impresion de esta aplicacion, y la diferencia entre cortar y
 * disolver es lo que separa "arranca" de "parece rota".
 *
 * Con movimiento reducido se navega sin transicion, que es el estado final
 * (§11), no una version acortada de la animacion.
 *
 * @param destination Ruta de salida, o null mientras se resuelve.
 * @returns La opacidad compartida que debe aplicar la pantalla.
 */
export function useSplashExit(destination: BootDestination | null): SharedValue<number> {
  const router = useRouter();
  const isReducedMotion = useReducedMotion();
  const opacity = useSharedValue(1);
  const mountedAt = useRef(0);

  useEffect(() => {
    mountedAt.current = Date.now();
  }, []);

  useEffect(() => {
    if (destination === null) {
      return;
    }

    reportBootDuration(mountedAt.current, destination);
    const leave = () => router.replace(destination);

    if (isReducedMotion) {
      leave();
      return;
    }

    opacity.value = withTiming(0, timing(motion.micro), (finished) => {
      if (finished === true) {
        runOnJS(leave)();
      }
    });
  }, [destination, isReducedMotion, opacity, router]);

  return opacity;
}

/**
 * Registra cuanto tardo el arranque en resolverse.
 *
 * Es la medida que calibra la duracion del trazo del latido: si el arranque
 * tarda unos 900 ms, el latido dura unos 900 ms y casi siempre se completa
 * solo. Elegir un numero redondo a ojo garantizaria lo contrario.
 */
function reportBootDuration(startedAt: number, destination: BootDestination): void {
  if (!__DEV__) {
    return;
  }
  console.warn(`[boot] destino ${destination} resuelto en ${Date.now() - startedAt} ms`);
}
