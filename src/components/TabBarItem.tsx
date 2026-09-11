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
  /**
   * `tab` para una seccion, `button` para una accion. Capturar es lo segundo: no
   * cambia de seccion, abre la camara.
   */
  readonly role: 'tab' | 'button';
}

/**
 * Elemento de la barra de pestanas.
 *
 * ICONO Y ETIQUETA, no icono solo. Los iconos son propios y salen del
 * vocabulario del instrumento —el latido, la hoja, la guia de encuadre—, pero
 * ninguno de ellos es tan universal como para prescindir del texto: §12.3 no
 * admite que la forma sea el unico portador de significado, y una silueta de
 * hoja con un trazado dentro se puede leer como "documento" o como "estudio"
 * segun quien mire.
 *
 * CAPTURAR YA NO SE RELLENA. Fue una pildora de tinta para destacar sobre las
 * pestanas; con la burbuja deslizante chocaba con ella —dos formas rellenas en
 * la misma barra, una de ellas quieta— y hacia dudar de cual marcaba la seccion
 * actual. Ahora es un hueco como los demas, y la burbuja nunca se posa en el.
 *
 * LA PESTANA ACTIVA VA EN CARMIN, ademas de la burbuja: §12.9 prohibe
 * el carmin como RELLENO de un elemento pequeno, no como tinte de un icono y su
 * etiqueta. Marcar la pestana activa con el color de acento es la convencion de
 * iOS, y hacia falta: con tinta oscura contra gris, a trece puntos y sobre
 * vidrio, la diferencia no se leia —la propia autora dijo que la barra «no se
 * hovereaba»—, aunque el estado de accesibilidad si fuera correcto. Comprobado
 * en el arbol: `selected=true` en la pestana buena. El problema era de contraste,
 * no de logica. Medido, el carmin sobre el vidrio claro da 7.4:1.
 *
 * NO TENIA NINGUNA RESPUESTA AL DEDO. Ni opacidad ni nada: se tocaba una
 * pestana y no ocurria absolutamente nada hasta que la ruta cambiaba, o sea que
 * en una navegacion lenta el toque parecia perdido. Ahora se hunde con el muelle
 * de §11, igual que el resto de controles.
 *
 * @param label Texto del elemento.
 * @param icon Icono del elemento.
 * @param onPress Accion al pulsarlo.
 * @param isActive Cierto si es la pestana actual.
 * @param role Seccion o accion.
 * @returns El elemento renderizado.
 */
export function TabBarItem({ label, icon, onPress, isActive, role }: TabBarItemProps) {
  const theme = useTheme();
  const press = usePressMotion();
  const color = isActive ? brand.carmine : theme.textLow;

  return (
    <AnimatedPressable
      accessibilityRole={role}
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      onPress={() => {
        playHaptic('selection');
        onPress();
      }}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.item, press.style]}
    >
      <TabIcon name={icon} color={color} />
      <Text style={[type.caption, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  item: {
    flex: 1,
    minHeight: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: gap.xs,
    paddingHorizontal: gap.xs,
    borderRadius: radius.pill,
    gap: gap.xs,
  },
});
