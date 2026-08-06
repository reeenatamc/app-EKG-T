import { Pressable, StyleSheet, Text } from 'react-native';

import { TabIcon } from '@/components/icons/TabIcon';
import type { TabIconName } from '@/components/icons/tabIcons';
import { useTheme } from '@/design/theme';
import { brand, gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface TabBarItemProps {
  readonly label: string;
  readonly icon: TabIconName;
  readonly onPress: () => void;
  readonly isActive: boolean;
  /**
   * Marca la accion principal. Se pinta rellena para que destaque sobre las
   * pestanas de navegacion, que solo cambian de sitio.
   */
  readonly isPrimary?: boolean;
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
 * LA ACCION PRINCIPAL SE RELLENA DE TINTA, no de carmin. La regla de tamano de
 * §12.9 reserva el **relleno** de carmin para superficies grandes, y esta pildora
 * mide unos 76 puntos: a ese tamano un rojo saturado sobre vidrio se lee como un
 * aviso. La inversion tinta/lienzo la separa igual de bien de las pestanas, que
 * solo cambian de sitio.
 *
 * LA PESTANA ACTIVA SI VA EN CARMIN, y no contradice lo anterior: §12.9 prohibe
 * el carmin como RELLENO de un elemento pequeno, no como tinte de un icono y su
 * etiqueta. Marcar la pestana activa con el color de acento es la convencion de
 * iOS, y hacia falta: con tinta oscura contra gris, a trece puntos y sobre
 * vidrio, la diferencia no se leia —la propia autora dijo que la barra «no se
 * hovereaba»—, aunque el estado de accesibilidad si fuera correcto. Comprobado
 * en el arbol: `selected=true` en la pestana buena. El problema era de contraste,
 * no de logica. Medido, el carmin sobre el vidrio claro da 7.4:1.
 *
 * @param label Texto del elemento.
 * @param icon Icono del elemento.
 * @param onPress Accion al pulsarlo.
 * @param isActive Cierto si es la pestana actual.
 * @param isPrimary Cierto para la accion principal.
 * @returns El elemento renderizado.
 */
export function TabBarItem({ label, icon, onPress, isActive, isPrimary = false }: TabBarItemProps) {
  const theme = useTheme();
  const color = isPrimary ? theme.canvas : isActive ? brand.carmine : theme.textLow;

  return (
    <Pressable
      accessibilityRole={isPrimary ? 'button' : 'tab'}
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.item, isPrimary ? { backgroundColor: theme.textHigh } : null]}
    >
      <TabIcon name={icon} color={color} />
      <Text style={[type.caption, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
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
