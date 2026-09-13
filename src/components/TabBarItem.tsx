import { StyleSheet, Text } from 'react-native';

import { TabIcon } from '@/components/icons/TabIcon';
import type { TabIconName } from '@/components/icons/tabIcons';
import { useTheme } from '@/design/theme';
import { playHaptic } from '@/design/haptics';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';
import { brand, gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface TabBarItemProps {
  readonly label: string;
  readonly icon: TabIconName;
  readonly onPress: () => void;
  readonly isActive: boolean;
  readonly expanded: boolean;
  readonly width: number;
  /**
   * `tab` para una seccion, `button` para una accion. Capturar es lo segundo: no
   * cambia de seccion, abre la camara.
   */
  readonly role: 'tab' | 'button';
}

/** La sección activa muestra su nombre; con texto ampliado, todas lo muestran. */
export function TabBarItem(props: TabBarItemProps) {
  const { label, icon, onPress, isActive, role, expanded, width } = props;
  const theme = useTheme();
  const press = usePressMotion();
  // EN OSCURO, TINTA CLARA Y NO CARMIN. Sobre la burbuja del tema oscuro el carmin
  // medía 1.24:1: la pestaña activa era la unica que no se leia. El unico texto
  // que aguanta el peor fondo bajo ese vidrio es `textHigh` (4.84:1, fijado en
  // `contrast.test.ts`); la seleccion la sigue diciendo la burbuja.
  const activeColor = theme.mode === 'dark' ? theme.textHigh : brand.carmine;
  const color = isActive ? activeColor : theme.textLow;

  return (
    <AnimatedPressable
      accessibilityRole={role}
      accessibilityState={role === 'tab' ? { selected: isActive } : undefined}
      accessibilityLabel={label}
      onPress={() => {
        playHaptic('selection');
        onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.item, expanded && styles.horizontal, { width }, press.style]}
    >
      <TabIcon name={icon} color={color} />
      {!expanded || isActive ? (
        <Text style={[type.caption, styles.label, { color }]}>{label}</Text>
      ) : null}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  label: { lineHeight: size.tabLabelLineHeight, flexShrink: 1, textAlign: 'center' },
  horizontal: { flexDirection: 'row', gap: gap.sm },
  item: {
    minHeight: size.tabHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: gap.sm,
    paddingHorizontal: gap.xs,
    borderRadius: radius.pill,
    gap: gap.xs,
  },
});
