import { useEffect } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import type { Rect } from '@/camera/framing';
import { CAMERA_TEXT } from '@/constants/captureText';
import { useReducedMotion } from '@/design/a11y';
import { timing } from '@/design/motion';
import { gap, motion, opacity, paperDark, radius, scrim, size } from '@/design/tokens';
import { type } from '@/design/type';

interface FramingGuideProps {
  readonly frame: Rect;
  /** Cierto cuando el telefono esta bastante paralelo al papel. */
  readonly isAligned: boolean;
}

/**
 * Guia visual de encuadre superpuesta a la vista previa.
 *
 * El velo puede ser translucido, pero la guia en si no: es un dato operativo,
 * no ambiente, asi que va en trazo solido y con el contraste fijo del tema
 * oscuro, independientemente del tema de la aplicacion. La pantalla de captura
 * es siempre oscura por un motivo optico, no estetico: ver CameraScreen.
 *
 * Oscurece el exterior del marco con cuatro bandas en lugar de una mascara:
 * React Native no recorta agujeros sin recurrir a una biblioteca de dibujo, y
 * cuatro vistas planas son mas baratas de componer.
 *
 * MOMENTO FIRMA. Al quedar alineado, la guia se afila durante los 200 ms de
 * motion.micro: gana grosor y luminancia. No cambia de tono, y el motivo esta
 * en size.frameBorderAligned. Se consigue superponiendo una segunda guia mas
 * gruesa cuya opacidad es lo unico que se anima, porque §11 no permite animar
 * propiedades de disposicion como borderWidth: obligarian a Yoga a recalcular
 * la disposicion en cada fotograma con la camara en vivo detras.
 *
 * No intercepta toques para que el obturador siga siendo pulsable.
 *
 * @param frame Marco de encuadre en coordenadas del contenedor.
 * @param isAligned Cierto cuando el encuadre esta alineado.
 * @returns La superposicion de encuadre.
 */
export function FramingGuide({ frame, isAligned }: FramingGuideProps) {
  const bands = computeDimmedBands(frame);
  const alignment = useSharedValue(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const target = isAligned ? 1 : 0;
    // Con movimiento reducido se salta al estado final, no se acorta: §11.
    alignment.value = reduceMotion ? target : withTiming(target, timing(motion.micro));
  }, [alignment, isAligned, reduceMotion]);

  const alignedStyle = useAnimatedStyle(() => ({ opacity: alignment.value }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[styles.dimmed, bands.top]} />
      <View style={[styles.dimmed, bands.bottom]} />
      <View style={[styles.dimmed, bands.left]} />
      <View style={[styles.dimmed, bands.right]} />

      <View style={[styles.frame, styles.searching, toFrameStyle(frame)]} />
      <Animated.View style={[styles.frame, styles.aligned, toFrameStyle(frame), alignedStyle]} />

      <Text style={[styles.instruction, { top: frame.y + frame.height + gap.xl }]}>
        {isAligned ? CAMERA_TEXT.aligned : CAMERA_TEXT.instruction}
      </Text>
    </View>
  );
}

/**
 * Calcula las cuatro bandas que oscurecen el area exterior al marco.
 */
function computeDimmedBands(frame: Rect): Record<'top' | 'bottom' | 'left' | 'right', ViewStyle> {
  return {
    top: { top: 0, left: 0, right: 0, height: frame.y },
    bottom: { top: frame.y + frame.height, left: 0, right: 0, bottom: 0 },
    left: { top: frame.y, left: 0, width: frame.x, height: frame.height },
    right: { top: frame.y, left: frame.x + frame.width, right: 0, height: frame.height },
  };
}

function toFrameStyle(frame: Rect): ViewStyle {
  return { top: frame.y, left: frame.x, width: frame.width, height: frame.height };
}

const styles = StyleSheet.create({
  dimmed: { position: 'absolute', backgroundColor: scrim.strong },
  frame: {
    position: 'absolute',
    borderColor: paperDark.textHigh,
    borderRadius: radius.chip,
  },
  searching: { borderWidth: size.frameBorder, opacity: opacity.guideIdle },
  aligned: { borderWidth: size.frameBorderAligned },
  instruction: {
    ...type.body,
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    paddingHorizontal: gap.xl,
    color: paperDark.textHigh,
  },
});
