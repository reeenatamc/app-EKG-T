import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import { opacity, paperDark, radius, scrim, size } from '@/design/tokens';

interface TiltIndicatorProps {
  readonly offsetX: SharedValue<number>;
  readonly offsetY: SharedValue<number>;
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
 * LA POSTURA SE SIGUE DICIENDO, pero no aqui: el instrumento cambia de pregunta
 * solo y hay que escribirlo, y ahora lo escribe `CameraMessages`, que gira con el
 * telefono. El circulo no necesita girar: es igual en cualquier postura, y el
 * punto se mueve en coordenadas de la pantalla, que son las del sensor.
 *
 * @param offsetX Componente horizontal de la inclinacion, entre -1 y 1.
 * @param offsetY Componente vertical de la inclinacion, entre -1 y 1.
 * @returns El indicador de inclinacion.
 */
export function TiltIndicator({ offsetX, offsetY }: TiltIndicatorProps) {
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
    <View style={styles.container} pointerEvents="none">
      <View style={styles.target} />
      <Animated.View style={[styles.bubble, bubbleStyle]} />
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
