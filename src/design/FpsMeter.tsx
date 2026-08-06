import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';
import { useUiThreadFps } from '@/design/useUiThreadFps';

const RESET_LABEL = 'Reiniciar el minimo de fotogramas por segundo';

/**
 * Lectura de fotogramas por segundo del hilo de UI.
 *
 * Se apoya en superficie opaca y usa la familia monoespaciada, igual que
 * cualquier otra cifra: no es un signo vital, pero seguir la misma regla evita
 * que la excepcion se normalice.
 *
 * @returns El medidor de fotogramas.
 */
export function FpsMeter() {
  const theme = useTheme();
  const { current, minimum, reset } = useUiThreadFps();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={RESET_LABEL}
      onPress={reset}
      style={[styles.container, { backgroundColor: theme.surface }]}
    >
      <View>
        <Text style={[styles.value, { color: theme.textHigh }]}>{current}</Text>
        <Text style={[styles.label, { color: theme.textLow }]}>fps ahora</Text>
      </View>
      <View>
        <Text style={[styles.value, { color: theme.textHigh }]}>{minimum}</Text>
        <Text style={[styles.label, { color: theme.textLow }]}>fps minimo</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: size.touchTarget,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: gap.sm,
    paddingHorizontal: gap.lg,
    borderRadius: radius.tile,
  },
  value: { ...type.data, fontSize: type.h1.fontSize, textAlign: 'center' },
  label: { ...type.caption, textAlign: 'center' },
});
