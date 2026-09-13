import { StyleSheet, View, type ViewProps } from 'react-native';

import { useReducedTransparency } from '@/design/a11y';
import { useTheme } from '@/design/theme';
import { frost, radius, size } from '@/design/tokens';

/**
 * Tarjeta escarchada: translucida y con filo, sin desenfoque.
 *
 * Deja ver la atmosfera suave de las pestanas. Con la transparencia reducida cae a
 * la superficie opaca del tema, igual que el vidrio (§12.6).
 *
 * No es para cifras clinicas ni para controles, que van sobre superficie opaca
 * (§12.1). Tampoco lleva sombra: bajo un relleno translucido iOS la dibuja a
 * traves de la tarjeta y la ensucia.
 *
 * VOLUMEN CON UN BISEL, NO CON UNA RAYA. La luz especular recta de un punto se cortaba
 * de golpe al empezar la curva de la esquina y en oscuro era una linea brillante
 * que no seguia la forma. Ahora el propio filo hace de luz: iluminado arriba y a la
 * izquierda, en sombra abajo y a la derecha. Como es el borde, recorre la curva
 * entera y la tarjeta se lee como una pieza con grosor en los dos temas.
 *
 * @param props Props de una vista; `style` fija relleno interior y disposicion.
 * @returns La tarjeta.
 */
export function FrostCard({ children, style, ...rest }: ViewProps) {
  const theme = useTheme();
  const isFlat = useReducedTransparency();
  const palette = frost[theme.mode === 'dark' ? 'dark' : 'light'];
  const surface = isFlat
    ? { backgroundColor: theme.surface, borderColor: theme.edge }
    : {
        backgroundColor: palette.fill,
        borderTopColor: palette.rim,
        borderLeftColor: palette.rim,
        borderBottomColor: palette.edge,
        borderRightColor: palette.edge,
      };

  return (
    <View {...rest} style={[styles.card, surface, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    borderWidth: size.hairline,
    overflow: 'hidden',
  },
});
