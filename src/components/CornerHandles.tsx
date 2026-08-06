import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';

import type { Rect } from '@/camera/framing';
import type { Point } from '@/camera/quad';
import type { QuadCorners } from '@/camera/useQuadCorners';
import { CORNER_LABELS } from '@/constants/captureText';
import { opacity, paperDark, radius, size } from '@/design/tokens';

interface CornerHandlesProps {
  readonly corners: QuadCorners['corners'];
  /** Region donde se dibuja la imagen, en coordenadas del contenedor. */
  readonly bounds: Rect;
  /** Falso cuando el cuadrilatero esta cruzado. */
  readonly isValid: boolean;
  /**
   * Se invoca al soltar una esquina.
   *
   * La previsualizacion enderezada se recalcula aqui y no durante el arrastre:
   * mientras se arrastra se miran las esquinas, no el resultado, y rehacer una
   * transformacion de perspectiva sobre una fotografia a resolucion plena
   * sesenta veces por segundo no lo aguanta un telefono de gama media.
   */
  readonly onSettled: () => void;
}

/**
 * Las cuatro esquinas arrastrables y el contorno que las une.
 *
 * TODO OCURRE EN EL HILO DE UI. El gesto escribe sobre valores compartidos y
 * los estilos se derivan de ellos con useAnimatedStyle: el hilo de JavaScript
 * no interviene en el arrastre. Es la diferencia entre un recorte que se pega
 * al dedo y uno que va un fotograma por detras, y sobre una fotografia a
 * resolucion plena esa diferencia se nota.
 *
 * El contorno se dibuja con cuatro vistas de las que solo se animan
 * transformaciones —trasladar, girar y escalar en horizontal—, nunca ancho ni
 * posicion, que obligarian a recalcular la disposicion en cada fotograma. Por
 * eso cada lado es una vista de un punto de ancho con el origen en su extremo
 * izquierdo: escalarla en x la convierte en el segmento.
 *
 * ARRASTRAR ES OPCIONAL, y eso importa para accesibilidad. Las esquinas parten
 * del marco que el usuario ya encuadro, asi que el flujo se completa entero sin
 * tocarlas. Quien no pueda hacer un arrastre preciso no queda fuera: pierde el
 * ajuste fino, no la funcion.
 *
 * @param corners Las cuatro esquinas como valores compartidos.
 * @param bounds Region donde se dibuja la imagen.
 * @param isValid Falso cuando las esquinas se han cruzado.
 * @returns Las esquinas y su contorno.
 */
export function CornerHandles({ corners, bounds, isValid, onSettled }: CornerHandlesProps) {
  const [topLeft, topRight, bottomRight, bottomLeft] = corners;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <QuadEdge from={topLeft} to={topRight} isValid={isValid} />
      <QuadEdge from={topRight} to={bottomRight} isValid={isValid} />
      <QuadEdge from={bottomRight} to={bottomLeft} isValid={isValid} />
      <QuadEdge from={bottomLeft} to={topLeft} isValid={isValid} />

      {corners.map((corner, index) => (
        <CornerHandle
          key={CORNER_LABELS[index]}
          corner={corner}
          bounds={bounds}
          label={CORNER_LABELS[index] ?? ''}
          onSettled={onSettled}
        />
      ))}
    </View>
  );
}

interface QuadEdgeProps {
  readonly from: SharedValue<Point>;
  readonly to: SharedValue<Point>;
  readonly isValid: boolean;
}

/**
 * Un lado del cuadrilatero, como segmento entre dos esquinas vivas.
 */
function QuadEdge({ from, to, isValid }: QuadEdgeProps) {
  const style = useAnimatedStyle(() => {
    'worklet';
    const dx = to.value.x - from.value.x;
    const dy = to.value.y - from.value.y;

    return {
      transform: [
        { translateX: from.value.x },
        { translateY: from.value.y },
        { rotateZ: `${Math.atan2(dy, dx)}rad` },
        { scaleX: Math.hypot(dx, dy) },
      ],
    };
  });

  // Cruzado se senala apagando el trazo, no cambiando su color. El rojo de
  // error pertenece a semantic.alarmHigh, que esta reservado a alarmas
  // fisiologicas: un recorte mal hecho no es una alarma clinica.
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.edge, isValid ? null : styles.edgeInvalid, style]}
    />
  );
}

interface CornerHandleProps {
  readonly corner: SharedValue<Point>;
  readonly bounds: Rect;
  readonly label: string;
  readonly onSettled: () => void;
}

/**
 * Una esquina arrastrable.
 */
function CornerHandle({ corner, bounds, label, onSettled }: CornerHandleProps) {
  const gesture = useMemo(
    () => createCornerGesture(corner, bounds, onSettled),
    [corner, bounds, onSettled],
  );

  const style = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [
        { translateX: corner.value.x - size.cornerHandle / 2 },
        { translateY: corner.value.y - size.cornerHandle / 2 },
      ],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View accessibilityLabel={label} style={[styles.handle, style]}>
        <View style={styles.handleDot} />
      </Animated.View>
    </GestureDetector>
  );
}

/**
 * Construye el gesto de arrastre de una esquina.
 *
 * Es una funcion corriente y no un gancho a proposito. Escribir sobre un valor
 * compartido es el modo normal de trabajar de Reanimated, pero el analisis de
 * React lo lee como una mutacion prohibida en cuanto el nombre empieza por use.
 *
 * El confinamiento se escribe aqui dentro en lugar de llamar a
 * clampPointToRect. Un worklet no puede invocar funciones de otro modulo,
 * porque el complemento de compilacion no las arrastra al hilo de UI; y sacar
 * el gesto al hilo de JavaScript para poder reutilizar dos lineas de aritmetica
 * costaria un fotograma de retraso en cada movimiento del dedo.
 *
 * @param corner Esquina a mover.
 * @param bounds Limites dentro de los que puede moverse.
 * @param onSettled Se invoca al soltar.
 * @returns El gesto de arrastre.
 */
function createCornerGesture(corner: SharedValue<Point>, bounds: Rect, onSettled: () => void) {
  return Gesture.Pan()
    .onChange((event) => {
      'worklet';
      // onChange entrega el incremento desde el fotograma anterior, asi que no
      // hace falta recordar donde empezo el dedo ni cuadrar origenes.
      const nextX = corner.value.x + event.changeX;
      const nextY = corner.value.y + event.changeY;

      corner.value = {
        x: Math.min(Math.max(nextX, bounds.x), bounds.x + bounds.width),
        y: Math.min(Math.max(nextY, bounds.y), bounds.y + bounds.height),
      };
    })
    .onFinalize(() => {
      'worklet';
      runOnJS(onSettled)();
    });
}

const styles = StyleSheet.create({
  edge: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 1,
    height: size.frameBorder,
    // El origen en el extremo izquierdo es lo que permite que trasladar lleve
    // el principio del segmento a la esquina y escalar lo estire hasta la otra.
    transformOrigin: 'left center',
    backgroundColor: paperDark.textHigh,
  },
  edgeInvalid: { opacity: opacity.disabled },
  handle: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: size.cornerHandle,
    height: size.cornerHandle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handleDot: {
    width: size.cornerHandleDot,
    height: size.cornerHandleDot,
    borderRadius: radius.pill,
    backgroundColor: paperDark.textHigh,
    borderWidth: size.frameBorder,
    borderColor: paperDark.canvas,
  },
});
