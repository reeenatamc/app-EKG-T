import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { PLAYGROUND_TEXT } from '@/constants/text';
import { SplashHeart } from '@/design/SplashHeart';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

/** La misma duracion que en el arranque, para revisar el ritmo real. */
const DURATION_MS = 1800;

/**
 * Muestrario del corazon del arranque.
 *
 * Existe porque en el arranque real la animacion se ve una vez y no da tiempo a
 * revisarla. Aqui se puede repetir a voluntad y, sobre todo, comprobar como se
 * comportan la sombra y el halo en cada tema.
 *
 * Pulsar vuelve a lanzarlo remontando el componente. El alto lo pone la propia
 * escena a partir del ancho medido.
 *
 * @returns El muestrario del corazon.
 */
export function BeatSpecimen() {
  const theme = useTheme();
  const [runId, setRunId] = useState(0);
  const [width, setWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={PLAYGROUND_TEXT.beatReplay}
      onPress={() => setRunId(runId + 1)}
      style={[styles.container, { backgroundColor: theme.surface }]}
    >
      <Text style={[type.caption, { color: theme.textLow }]}>{PLAYGROUND_TEXT.beatHint}</Text>
      <View style={styles.stage} onLayout={handleLayout}>
        {width > 0 ? (
          <SplashHeart
            key={runId}
            durationMs={DURATION_MS}
            width={width}
            isDark={theme.mode === 'dark'}
            traceColor={theme.bloom}
          />
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: size.touchTarget,
    padding: gap.lg,
    borderRadius: radius.tile,
    gap: gap.sm,
  },
  stage: { width: '100%' },
});
