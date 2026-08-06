import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import { useReducedMotion as useSystemReducedMotion } from 'react-native-reanimated';

import { useSettings } from '@/state/settings';

/**
 * Indica si la interfaz debe renunciar al vidrio y usar superficies opacas.
 *
 * Combina la preferencia del sistema con el interruptor de Ajustes. La union
 * no es redundante: en Android isReduceTransparencyEnabled() devuelve siempre
 * false (SKILL.md §0), de modo que alli el interruptor es la unica via.
 *
 * @returns Cierto si hay que renderizar sin transparencias.
 */
export function useReducedTransparency(): boolean {
  const [system, setSystem] = useState(false);
  const manual = useSettings((state) => state.reduceTransparency);

  useEffect(() => {
    let active = true;

    void AccessibilityInfo.isReduceTransparencyEnabled().then((value) => {
      if (active) {
        setSystem(value);
      }
    });

    const subscription = AccessibilityInfo.addEventListener('reduceTransparencyChanged', setSystem);

    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  return system || manual;
}

/**
 * Indica si las animaciones deben saltar directamente a su estado final.
 *
 * Reanimated ya lee la preferencia del sistema; aqui solo se le suma el
 * interruptor manual, por coherencia con useReducedTransparency y para que el
 * Playground pueda demostrar la rama sin tocar los ajustes del dispositivo.
 *
 * @returns Cierto si hay que renderizar sin movimiento.
 */
export function useReducedMotion(): boolean {
  const system = useSystemReducedMotion();
  const manual = useSettings((state) => state.reduceMotion);

  return system || manual;
}
