import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';

import { useReducedMotion } from '@/design/a11y';
import { spring } from '@/design/motion';
import { targetScale } from '@/design/press';

/**
 * `Pressable` capaz de recibir estilos animados.
 *
 * Se crea una sola vez a nivel de modulo: `createAnimatedComponent` dentro de un
 * componente devolveria un tipo nuevo en cada render y React desmontaria y
 * volveria a montar el arbol entero debajo.
 */
export const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface PressMotion {
  /** Estilo animado a pasar al pulsable. */
  readonly style: ReturnType<typeof useAnimatedStyle>;
  readonly onPressIn: () => void;
  readonly onPressOut: () => void;
}

/**
 * Hace que un control acuse el dedo.
 *
 * POR QUE UN MUELLE Y NO UNA CURVA. Un control pulsado no viaja a ningun sitio:
 * responde y vuelve. El muelle unico de §11 ya esta escrito en `motion.ts` y
 * hasta ahora solo lo gastaba el banco de pruebas del playground.
 *
 * SOLO SE ANIMA `transform`, como pide §11: animar tamano o disposicion obliga
 * a Yoga a recalcular en cada fotograma. La escala corre ademas en el hilo de
 * interfaz, asi que la respuesta al dedo no depende de que React llegue a
 * tiempo a renderizar.
 *
 * @returns El estilo animado y los dos manejadores del pulsable.
 */
export function usePressMotion(): PressMotion {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return {
    style,
    onPressIn: () => settle(scale, true, reduceMotion),
    onPressOut: () => settle(scale, false, reduceMotion),
  };
}

/**
 * Lleva la escala a donde toque.
 *
 * VIVE FUERA DEL GANCHO, como `placeCorners` en `useQuadCorners`. Asignar a un
 * valor compartido dentro de un `useCallback` lo denuncia
 * `react-hooks/immutability`: para el compilador de React eso es mutar algo que
 * considera inmutable. Recibiendolo por argumento la mutacion queda donde el
 * repositorio ya la pone.
 *
 * @param scale Escala compartida del control.
 * @param isPressed Cierto mientras el dedo esta encima.
 * @param reduceMotion Cierto si hay que renunciar al movimiento.
 */
function settle(scale: SharedValue<number>, isPressed: boolean, reduceMotion: boolean): void {
  scale.value = withSpring(targetScale(isPressed, reduceMotion), spring);
}
