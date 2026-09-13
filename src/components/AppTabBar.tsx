import { useIsFocused, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TabBarItem } from '@/components/TabBarItem';
import { chromeShadow } from '@/design/elevation';
import { GlassChrome } from '@/design/Glass';
import { useTheme } from '@/design/theme';
import { gap, glass, radius, size } from '@/design/tokens';
import { slotForPath, slotWidth, TAB_ITEMS, tabSpan } from '@/shell/tabBar';
import { useTabMotion } from '@/shell/TabMotionProvider';
import { useTabIndicator } from '@/shell/useTabIndicator';

/** Barra flotante; ruta activa, geometría y presentación tienen una sola fuente. */
export function AppTabBar() {
  const insets = useSafeAreaInsets();
  // Cada pestana monta su propia barra y las inactivas quedan en opacidad 0 por el
  // fundido: el vidrio nativo solo se enciende en la pestana que se ve (D-26).
  const isFocused = useIsFocused();
  const [width, setWidth] = useState(0);
  const { fontScale } = useWindowDimensions();
  const active = slotForPath(usePathname());
  const expanded =
    active !== null &&
    width >= size.tabExpandedMinWidth &&
    fontScale <= size.tabExpandedMaxFontScale;
  const itemWidth = slotWidth(width, gap.xs, gap.xs, expanded);

  return (
    <View
      style={[styles.slot, chromeShadow, { bottom: insets.bottom + gap.sm }]}
      pointerEvents="box-none"
    >
      <GlassChrome visible={isFocused}>
        <View style={styles.row} onLayout={({ nativeEvent }) => setWidth(nativeEvent.layout.width)}>
          <TabIndicator active={active} width={itemWidth} expanded={expanded} />
          <TabItems active={active} expanded={expanded} width={itemWidth} />
        </View>
      </GlassChrome>
    </View>
  );
}

type TabItem = (typeof TAB_ITEMS)[number];

interface TabItemsProps {
  readonly active: number | null;
  readonly expanded: boolean;
  readonly width: number;
}

/** Los cuatro huecos, en el orden de `TAB_ITEMS`. */
function TabItems({ active, expanded, width }: TabItemsProps) {
  const press = useTabPress();

  return (
    <>
      {TAB_ITEMS.map((item, index) => (
        <TabBarItem
          key={item.icon}
          label={item.label}
          icon={item.icon}
          isActive={index === active}
          expanded={expanded}
          width={tabSpan(width, expanded && index === active)}
          role={item.route === null ? 'button' : 'tab'}
          onPress={() => press(item, index)}
        />
      ))}
    </>
  );
}

/**
 * Lo que hace tocar un hueco.
 *
 * Capturar es una accion y abre la camara. Una pestana mueve la capsula antes de
 * navegar, para que la respuesta al dedo no espere a que monte la pantalla nueva.
 */
function useTabPress(): (item: TabItem, index: number) => void {
  const router = useRouter();
  const { moveTo } = useTabMotion();

  return (item, index) => {
    if (item.route === null) {
      router.push('/capture');
      return;
    }
    moveTo(index);
    router.navigate(item.route);
  };
}

interface IndicatorProps {
  readonly active: number | null;
  readonly width: number;
  readonly expanded: boolean;
}

function TabIndicator({ active, width, expanded }: IndicatorProps) {
  const theme = useTheme();
  const motion = useTabIndicator(active, width);
  const dark = theme.mode === 'dark';
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.bubble,
        {
          width: tabSpan(width, expanded),
          backgroundColor: dark ? glass.selectionDark : glass.selectionLight,
        },
        motion,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', left: gap.xl, right: gap.xl, borderRadius: radius.pill },
  row: { flexDirection: 'row', padding: gap.xs, gap: gap.xs },
  bubble: {
    position: 'absolute',
    top: gap.xs,
    bottom: gap.xs,
    left: 0,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
  },
});
