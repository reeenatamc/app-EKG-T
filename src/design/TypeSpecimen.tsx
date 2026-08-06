import { StyleSheet, Text, View } from 'react-native';

import { PLAYGROUND_TEXT } from '@/constants/text';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { type } from '@/design/type';

/**
 * Muestrario de la escala tipografica.
 *
 * La cifra vital va sobre superficie opaca y en la familia monoespaciada, que
 * es justamente la regla que este muestrario debe demostrar: si alguna vez
 * aparece sobre vidrio, se vera aqui antes que en produccion.
 *
 * @returns El muestrario tipografico.
 */
export function TypeSpecimen() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[type.caption, { color: theme.textLow }]}>{PLAYGROUND_TEXT.typeTitle}</Text>
      <Text style={[type.display, styles.line, { color: theme.textHigh }]}>Aa</Text>
      <Text style={[type.h1, styles.line, { color: theme.textHigh }]}>Titular de seccion</Text>
      <Text style={[type.body, styles.line, { color: theme.textHigh }]}>
        Cuerpo de texto legible a dieciseis puntos.
      </Text>
      <Text style={[type.data, styles.line, { color: theme.textLow }]}>
        0123456789 · monoespaciada
      </Text>

      <Text style={[type.vital, styles.line, { color: theme.textHigh }]}>
        {PLAYGROUND_TEXT.vitalSample}
      </Text>
      <Text style={[type.caption, { color: theme.textLow }]}>{PLAYGROUND_TEXT.vitalCaption}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: gap.lg, borderRadius: radius.tile },
  line: { marginTop: gap.sm },
});
