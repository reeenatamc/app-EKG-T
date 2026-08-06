import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PLAYGROUND_TEXT } from '@/constants/text';
import { GlassChrome } from '@/design/Glass';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

/**
 * Chrome flotante del banco de pruebas.
 *
 * Simula la barra de pestanas de la Etapa 2 y consume la segunda de las dos
 * superficies de vidrio que permite §3. Respeta las areas seguras: un chrome
 * que tape el indicador de inicio no es una decision de diseno.
 *
 * @returns El chrome flotante.
 */
export function PlaygroundChrome() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.slot, { bottom: insets.bottom + gap.lg }]} pointerEvents="box-none">
      <GlassChrome style={styles.chrome}>
        <Text style={[type.caption, { color: theme.textHigh }]}>{PLAYGROUND_TEXT.chromeLabel}</Text>
      </GlassChrome>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: { position: 'absolute', left: gap.lg, right: gap.lg, alignItems: 'center' },
  chrome: { paddingVertical: gap.md, paddingHorizontal: gap.xl },
});
