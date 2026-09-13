import { useWindowDimensions } from 'react-native';

import { tabBarClearance } from '@/shell/tabBar';

/** Las pantallas reservan el mismo espacio que necesita la barra con texto ampliado. */
export function useTabBarClearance(): number {
  const { fontScale } = useWindowDimensions();
  return tabBarClearance(fontScale);
}
