import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import type { TiltMode } from '@/camera/tilt';
import { CAMERA_TEXT } from '@/constants/captureText';
import { gap, opacity, paperDark, radius, scrim, size } from '@/design/tokens';
import { type } from '@/design/type';

interface TiltIndicatorProps {
  readonly offsetX: SharedValue<number>;
  readonly offsetY: SharedValue<number>;
  /** Postura que ha deducido el nivel, para poder decirla. */
  readonly mode: TiltMode;
}

/**
 * Nivel de burbuja que indica la inclinacion del telefono.
 *
 * Se elige la forma de un nivel de albanil y no una barra ni un numero porque
 * es un instrumento que se entiende sin leer nada: hay que centrar el punto. Un
 * "12 grados" obliga a saber cuantos grados son aceptables, y una barra de
 * magnitud dice que estas torcido pero no hacia donde.
 *
 * Todo el movimiento ocurre en el hilo de UI. El valor llega como valor
 * compartido justamente para eso: se actualiza diez veces por segundo y como
 * estado de React provocaria diez renderizados por segundo con la camara en
 * vivo detras.
 *
 * Es dato operativo, no ambiente: trazo solido sobre velo, nunca vidrio.
 *
 * LLEVA ESCRITA LA POSTURA porque el instrumento cambia de pregunta solo. Con el
 * telefono boca abajo mide cuanto se aparta de la mesa; de pie, cuanto se aparta
 * de la vertical. Sin decirlo, quien levanta el telefono ve el punto saltar y no
 * sabe si el error es suyo o de la aplicacion.
 *
 * @param offsetX Componente horizontal de la inclinacion, entre -1 y 1.
 * @param offsetY Componente vertical de la inclinacion, entre -1 y 1.
 * @param mode Postura deducida de la gravedad.
 * @returns El indicador de inclinacion.
 */
export function TiltIndicator({ offsetX, offsetY, mode }: TiltIndicatorProps) {
  const bubbleStyle = useAnimatedStyle(() => {
    'worklet';
    const travel = Math.hypot(offsetX.value, offsetY.value);
    // Se limita al borde en lugar de dejar que el punto se salga: fuera del
    // circulo la lectura ya no aporta, solo hace falta saber hacia donde tirar.
    const scale = travel > MAX_OFFSET ? MAX_OFFSET / travel : 1;

    return {
      transform: [
        { translateX: offsetX.value * scale * TRAVEL_RADIUS },
        { translateY: offsetY.value * scale * TRAVEL_RADIUS },
      ],
    };
  });

  return (
    <View style={styles.stack} pointerEvents="none">
      <View style={styles.container}>
        <View style={styles.target} />
        <Animated.View style={[styles.bubble, bubbleStyle]} />
      </View>
      <Text style={[type.eyebrow, styles.mode]}>
        {mode === 'flat' ? CAMERA_TEXT.tiltModeFlat : CAMERA_TEXT.tiltModeUpright}
      </Text>
    </View>
  );
}

/**
 * Inclinacion, en grados, que lleva el punto justo al borde del nivel.
 *
 * Por encima de eso la foto ya no sirve y da igual cuanto peor sea.
 */
const DEGREES_AT_EDGE = 20;

/** Componente de gravedad en el plano que corresponde a DEGREES_AT_EDGE. */
const MAX_OFFSET = Math.sin((DEGREES_AT_EDGE * Math.PI) / 180);

/** Recorrido del punto, en puntos, desde el centro hasta el borde. */
const TRAVEL_RADIUS = (size.levelOuter - size.levelBubble) / 2 / MAX_OFFSET;

const styles = StyleSheet.create({
  stack: { alignItems: 'center', gap: gap.xs },
  // La etiqueta lleva su propio velo: cae sobre la imagen en vivo, que cambia de
  // claridad cada vez que se mueve la camara.
  mode: {
    color: paperDark.textHigh,
    backgroundColor: scrim.soft,
    paddingHorizontal: gap.xs,
    paddingVertical: 2,
    borderRadius: radius.chip,
    overflow: 'hidden',
  },
  container: {
    width: size.levelOuter,
    height: size.levelOuter,
    borderRadius: radius.pill,
    borderWidth: size.hairline,
    borderColor: paperDark.textLow,
    backgroundColor: scrim.soft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // La circunferencia interior marca donde deja de estar inclinado: mientras el
  // punto quepa dentro, el encuadre cuenta como alineado.
  target: {
    position: 'absolute',
    width: size.levelTarget,
    height: size.levelTarget,
    borderRadius: radius.pill,
    borderWidth: size.hairline,
    borderColor: paperDark.textLow,
    opacity: opacity.guideIdle,
  },
  bubble: {
    width: size.levelBubble,
    height: size.levelBubble,
    borderRadius: radius.pill,
    backgroundColor: paperDark.textHigh,
  },
});
