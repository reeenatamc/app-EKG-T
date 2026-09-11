import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { runOnJS, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';

import type { BootDestination } from '@/auth/useBootDestination';
import { useReducedMotion } from '@/design/a11y';
import { timing } from '@/design/motion';
import { motion } from '@/design/tokens';

/**
 * Cuanto se queda el splash como minimo, aunque el destino ya se sepa.
 *
 * Un latido entero mas un respiro. El destino se resuelve en unos 600 ms -- 642
 * medidos en un telefono de gama media con sesion guardada -- y a esa velocidad
 * la pantalla de arranque era un parpadeo: el latido no llegaba ni a cruzar la
 * pantalla. Lo que se veia era un destello, que se lee como un salto y no como
 * una entrada.
 *
 * No es un numero elegido a ojo: es lo que dura la animacion del latido mas el
 * tiempo de ver el trazo ya completo antes de que se disuelva. Rematar el gesto
 * es lo que hace que la entrada se sienta tranquila en lugar de apresurada.
 *
 * SE PAGA CON ESPERA. La aplicacion tarda ~0,8 s mas en estar disponible, y eso
 * es tiempo real del usuario cada vez que abre. Se acepta porque es la unica
 * pantalla de la aplicacion que no hace nada mas, y porque por debajo el trabajo
 * de arranque ya termino: lo que se espera es la animacion, no el sistema.
 */
const MIN_VISIBLE_MS = 1400;

/**
 * Salida del splash hacia su destino.
 *
 * Se sale cuando se sabe a donde ir Y el latido ha tenido tiempo de dibujarse.
 * Si el destino tarda mas que la animacion no se espera nada: el minimo es un
 * suelo, no una pausa que se suma.
 *
 * Si aun asi el latido no llego al final, no se corta: se desvanece durante la
 * transicion. Un electrocardiograma truncado a mitad del QRS no puede ser la
 * primera impresion de esta aplicacion, y la diferencia entre cortar y
 * disolver es lo que separa "arranca" de "parece rota".
 *
 * Con movimiento reducido se navega sin transicion y sin espera: ahi no hay
 * animacion que rematar, asi que el minimo no tendria a quien proteger y solo
 * seria un retraso. Es el estado final de §11, no una version acortada.
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

    const remaining = Math.max(0, MIN_VISIBLE_MS - (Date.now() - mountedAt.current));
    const timer = setTimeout(() => {
      opacity.value = withTiming(0, timing(motion.screen), (finished) => {
        if (finished === true) {
          runOnJS(leave)();
        }
      });
    }, remaining);

    return () => clearTimeout(timer);
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
