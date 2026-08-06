import { Canvas, Group, Path } from '@shopify/react-native-skia';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import {
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { STATUS_DETAIL, STATUS_TEXT } from '@/constants/studyText';
import { useReducedMotion } from '@/design/a11y';
import { BEAT_PATH, BEAT_VIEWBOX } from '@/design/beatPath';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface ProcessingIndicatorProps {
  /** Cierto en cola, falso procesando. Cambia solo el texto. */
  readonly isQueued: boolean;
}

/** Duracion de una respiracion completa. Lenta a proposito: no es una espera corta. */
const BREATH_MS = 2600;

/** Opacidad minima del latido al exhalar. Nunca llega a apagarse del todo. */
const EXHALE_OPACITY = 0.3;

const INDICATOR_HEIGHT = 110;

/**
 * Lo que se ve mientras el estudio se procesa.
 *
 * NO ES UN SPINNER. Un spinner es la forma universal de decir "espera" sin
 * decir nada mas, y aqui si hay algo que decir: lo que esta pasando es que se
 * esta recuperando una senal de una hoja de papel. El latido de §8 respirando
 * despacio lo dice sin una sola palabra, y ademas es el mismo latido del
 * arranque, asi que la aplicacion se reconoce a si misma.
 *
 * Con movimiento reducido aparece quieto y entero, igual que en el splash: §11
 * pide saltar al estado final, no acortar la animacion.
 *
 * @param isQueued Cierto si el estudio aun espera turno.
 * @returns El indicador de procesamiento.
 */
export function ProcessingIndicator({ isQueued }: ProcessingIndicatorProps) {
  const theme = useTheme();
  const reduceMotion = useReducedMotion();
  const [width, setWidth] = useState<number | null>(null);
  const traceOpacity = useBreath(reduceMotion);
  const status = isQueued ? 'queued' : 'processing';
  const handleLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  return (
    <View
      style={[styles.container, { backgroundColor: theme.surface }]}
      onLayout={handleLayout}
      accessibilityLabel={`${STATUS_TEXT[status]}. ${STATUS_DETAIL[status]}`}
    >
      <Canvas style={styles.canvas}>
        <BreathingBeat width={width} opacity={traceOpacity} color={theme.ink} />
      </Canvas>

      <Text style={[type.body, { color: theme.textHigh }]}>{STATUS_TEXT[status]}</Text>
      <Text style={[type.caption, { color: theme.textLow }]}>{STATUS_DETAIL[status]}</Text>
    </View>
  );
}

/**
 * Opacidad que sube y baja despacio, como una respiracion.
 *
 * @param reduceMotion Cierto si el usuario pidio menos movimiento.
 * @returns La opacidad, viva en el hilo de UI.
 */
function useBreath(reduceMotion: boolean) {
  const breath = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      // Se salta al estado final, no se acorta la animacion: §11.
      breath.value = 1;
      return;
    }

    breath.value = withRepeat(
      withTiming(EXHALE_OPACITY, { duration: BREATH_MS, easing: Easing.inOut(Easing.ease) }),
      // Indefinida y con vuelta atras: inhalar y exhalar.
      -1,
      true,
    );
  }, [breath, reduceMotion]);

  return useDerivedValue(() => breath.value);
}

interface BreathingBeatProps {
  readonly width: number | null;
  readonly opacity: ReturnType<typeof useDerivedValue<number>>;
  readonly color: string;
}

/**
 * El latido de §8, escalado al ancho disponible.
 *
 * Mismo encaje que SignalBloomLayer: escala por ancho y centra en vertical.
 */
function BreathingBeat({ width, opacity, color }: BreathingBeatProps) {
  if (BEAT_PATH === null || width === null) {
    return null;
  }

  const scale = width / BEAT_VIEWBOX.width;
  const translateY = INDICATOR_HEIGHT / 2 - (BEAT_VIEWBOX.height / 2) * scale;

  return (
    <Group transform={[{ translateY }, { scale }]} opacity={opacity}>
      <Path
        path={BEAT_PATH}
        style="stroke"
        strokeWidth={size.trace / scale}
        strokeJoin="round"
        strokeCap="round"
        color={color}
      />
    </Group>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: gap.xl,
    borderRadius: radius.tile,
    alignItems: 'center',
    gap: gap.xs,
  },
  canvas: { width: '100%', height: INDICATOR_HEIGHT },
});
