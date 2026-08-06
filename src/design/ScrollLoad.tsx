import { StyleSheet, Text, View } from 'react-native';

import { PLAYGROUND_TEXT } from '@/constants/text';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

/** Suficientes filas para que el scroll dure y el minimo de fps sea significativo. */
const ROW_COUNT = 24;

const ROWS = Array.from({ length: ROW_COUNT }, (_, index) => index + 1);

/**
 * Filas opacas que dan al scroll contenido real que recorrer.
 *
 * Ninguna lleva vidrio dentro: §13 marca el vidrio en filas de lista como
 * antipatron garantizado de tirones en Android, y el presupuesto de §3 ya lo
 * consumen el chrome flotante y la tarjeta de contexto.
 *
 * @returns Las filas de carga.
 */
export function ScrollLoad() {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[type.caption, { color: theme.textLow }]}>{PLAYGROUND_TEXT.scrollHint}</Text>
      {ROWS.map((row) => (
        <View key={row} style={[styles.row, { backgroundColor: theme.surface }]}>
          <Text style={[type.body, { color: theme.textHigh }]}>
            {PLAYGROUND_TEXT.scrollTitle} {row}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: gap.sm },
  row: {
    minHeight: size.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: gap.lg,
    borderRadius: radius.chip,
  },
});
