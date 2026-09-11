import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { QuarterTurn } from '@/camera/turn';
import { IconButton } from '@/components/IconButton';
import { ShutterButton } from '@/components/ShutterButton';
import { CAMERA_TEXT } from '@/constants/captureText';
import { gap, paperDark, scrim, size } from '@/design/tokens';

interface CaptureControlsProps {
  readonly isReady: boolean;
  readonly isCapturing: boolean;
  /** Giro del telefono: el icono de la galeria gira con el. */
  readonly turn: QuarterTurn;
  readonly onShutter: () => void;
  readonly onImport: () => void;
  /** El nivel, a la derecha del obturador, o null si no hay sensor. */
  readonly level: ReactNode;
}

/**
 * La fila de abajo: galeria, obturador y nivel.
 *
 * LA DISPOSICION DE UNA CAMARA DE SISTEMA. El obturador en el centro, la galeria
 * a un lado y un instrumento al otro. Antes eran una columna —avisos, obturador y
 * una etiqueta de texto «Elegir de la galeria» debajo— y con el telefono de lado
 * la etiqueta se leia torcida y los avisos tapaban el marco, que ahora es alto.
 * Los avisos se fueron al bloque de mensajes, que gira; la etiqueta es un icono,
 * que gira en su sitio sin ocupar mas.
 *
 * El nivel no gira: es un circulo, igual en cualquier postura.
 *
 * @param isReady Cierto cuando la camara ya puede disparar.
 * @param isCapturing Cierto mientras hay una captura en curso.
 * @param turn Giro del telefono.
 * @param onShutter Dispara la captura.
 * @param onImport Abre la galeria.
 * @param level El nivel, o null.
 * @returns Los controles de captura.
 */
export function CaptureControls({
  isReady,
  isCapturing,
  turn,
  onShutter,
  onImport,
  level,
}: CaptureControlsProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.controls, { bottom: insets.bottom + gap.xl }]}>
      <View style={[styles.side, { transform: [{ rotate: `${turn}deg` }] }]}>
        <IconButton
          icon="gallery"
          label={CAMERA_TEXT.fromGallery}
          onPress={onImport}
          color={paperDark.textHigh}
          background={scrim.strong}
        />
      </View>
      <ShutterButton onPress={onShutter} busy={isCapturing} disabled={!isReady} />
      <View style={styles.side}>{level}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  // Los dos lados miden lo mismo aunque uno este vacio: asi el obturador queda
  // centrado tambien en un telefono sin sensor de movimiento.
  side: { width: size.levelOuter, alignItems: 'center' },
});
