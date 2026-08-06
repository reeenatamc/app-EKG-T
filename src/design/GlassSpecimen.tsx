import { StyleSheet, Text } from 'react-native';

import { PLAYGROUND_TEXT } from '@/constants/text';
import { GlassCard } from '@/design/Glass';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

/**
 * Muestrario de la tarjeta de vidrio.
 *
 * Es la unica tarjeta de vidrio del banco de pruebas: junto con el chrome
 * flotante agota el presupuesto de dos superficies que fija §3, que es
 * exactamente la configuracion que hay que medir.
 *
 * @returns La tarjeta de contexto de muestra.
 */
export function GlassSpecimen() {
  const theme = useTheme();

  return (
    <GlassCard style={styles.card}>
      <Text style={[type.h1, { color: theme.textHigh }]}>{PLAYGROUND_TEXT.glassTitle}</Text>
      <Text style={[type.body, styles.body, { color: theme.textHigh }]}>
        {PLAYGROUND_TEXT.glassBody}
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { padding: gap.lg },
  body: { marginTop: gap.sm },
});
