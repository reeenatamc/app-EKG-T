import { useEffect } from 'react';
import { useAnimatedStyle } from 'react-native-reanimated';

import { gap } from '@/design/tokens';
import { slotOffset, TAB_ITEMS } from '@/shell/tabBar';
import { useTabMotion } from '@/shell/TabMotionProvider';

/** Sincroniza enlaces y navegación; el toque inicia el mismo movimiento antes de navegar. */
export function useTabIndicator(active: number | null, width: number) {
  const { position, moveTo } = useTabMotion();
  useEffect(() => {
    if (active !== null) moveTo(active);
  }, [active, moveTo]);

  return useAnimatedStyle(() => ({
    opacity: position.value < 0 || active === null ? 0 : 1,
    transform: [
      {
        translateX: slotOffset(
          Math.min(Math.max(position.value, 0), TAB_ITEMS.length - 1),
          width,
          gap.xs,
          gap.xs,
        ),
      },
    ],
  }));
}
