import { useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { PLAYGROUND_TEXT } from '@/constants/text';
import { SplashBeat } from '@/design/SplashBeat';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

/** Proporcion de la caja de muestra. Ancha y baja, como el latido. */
const ASPECT_RATIO = 3;

/**
 * Muestrario del latido del arranque.
 *
 * Existe porque en el arranque real el latido se ve durante unos ochocientos
 * milisegundos y no da tiempo a revisarlo. Aqui se puede repetir a voluntad y,
 * sobre todo, comprobar como se comporta el gradiente en cada tema: se diseno
 * sobre crema, y sobre el ciruela del tema oscuro hay que mirarlo.
 *
 * Pulsar vuelve a lanzarlo remontando el componente.
 *
 * @returns El muestrario del latido.
 */
export function BeatSpecimen() {
  const theme = useTheme();
  const [runId, setRunId] = useState(0);
  const [box, setBox] = useState({ width: 0, height: 0 });

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setBox({ width, height });
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
        {box.width > 0 ? (
          <SplashBeat
            key={runId}
            durationMs={1600}
            width={box.width}
            height={box.height}
            color={theme.bloom}
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
  stage: { width: '100%', aspectRatio: ASPECT_RATIO },
});
