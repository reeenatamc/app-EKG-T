import { createContext, useCallback, useContext, useMemo, useRef, type ReactNode } from 'react';
import { useSharedValue, withSpring, type SharedValue } from 'react-native-reanimated';

import { useReducedMotion } from '@/design/a11y';
import { spring } from '@/design/motion';

interface TabMotion {
  readonly position: SharedValue<number>;
  readonly moveTo: (slot: number) => void;
}

const TabMotionContext = createContext<TabMotion | null>(null);

/** Una selección compartida entre pantallas que se libera al salir del navegador. */
export function TabMotionProvider({ children }: { readonly children: ReactNode }) {
  const position = useSharedValue(-1);
  const target = useRef(-1);
  const reduced = useReducedMotion();
  const moveTo = useCallback(
    (slot: number) => {
      if (slot === target.current && !reduced) {
        return;
      }
      const first = target.current < 0;
      target.current = slot;
      position.set(first || reduced ? slot : withSpring(slot, spring));
    },
    [position, reduced],
  );
  const value = useMemo(() => ({ position, moveTo }), [position, moveTo]);

  return <TabMotionContext.Provider value={value}>{children}</TabMotionContext.Provider>;
}

/** Posicion compartida de la capsula. Solo existe dentro del grupo de pestanas. */
export function useTabMotion(): TabMotion {
  const context = useContext(TabMotionContext);
  if (context === null) {
    throw new Error('La barra requiere TabMotionProvider.');
  }
  return context;
}
