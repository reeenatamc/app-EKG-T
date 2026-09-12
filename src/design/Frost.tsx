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
 * SIN LUZ ESPECULAR, a diferencia del vidrio. Era una raya recta de un punto que el
 * recorte cortaba de golpe al empezar la curva de la esquina: invisible en claro y,
 * en oscuro, una linea brillante que no seguia la forma mientras el filo si. El
 * filo solo, que recorre la curva entera, dibuja la tarjeta mejor en los dos temas.
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
    : { backgroundColor: palette.fill, borderColor: palette.edge };

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
