import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CapturedPhoto } from '@/camera/capturePhoto';
import { importFromGallery } from '@/capture/importFromGallery';
import { ShutterButton } from '@/components/ShutterButton';
import { CAMERA_TEXT } from '@/constants/captureText';
import { gap, paperDark, radius, scrim, size } from '@/design/tokens';
import { type } from '@/design/type';

interface CaptureControlsProps {
  readonly isReady: boolean;
  readonly isCapturing: boolean;
  readonly isDim: boolean;
  readonly isTilted: boolean;
  readonly onShutter: () => void;
  readonly onImported: (photo: CapturedPhoto) => void;
}

/**
 * Obturador, avisos en vivo y entrada desde la galeria.
 *
 * Los avisos van justo encima del obturador, que es donde esta mirando el dedo
 * en el momento de disparar. Puestos arriba llegarian tarde.
 *
 * @param isReady Cierto cuando la camara ya puede disparar.
 * @param isCapturing Cierto mientras hay una captura en curso.
 * @param isDim Cierto con poca luz ambiente.
 * @param isTilted Cierto cuando el telefono no esta paralelo al papel.
 * @param onShutter Dispara la captura.
 * @param onImported Se invoca con una foto traida de la galeria.
 * @returns Los controles de captura.
 */
export function CaptureControls({
  isReady,
  isCapturing,
  isDim,
  isTilted,
  onShutter,
  onImported,
}: CaptureControlsProps) {
  const insets = useSafeAreaInsets();
  const { isImporting, importPhoto } = useGalleryImport(onImported);

  return (
    <View style={[styles.controls, { bottom: insets.bottom + gap.xl }]}>
      {isDim ? <Text style={styles.warning}>{CAMERA_TEXT.dimWarning}</Text> : null}
      {isTilted ? <Text style={styles.warning}>{CAMERA_TEXT.tiltWarning}</Text> : null}

      <ShutterButton onPress={onShutter} busy={isCapturing} disabled={!isReady} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={CAMERA_TEXT.fromGallery}
        onPress={importPhoto}
        disabled={isImporting}
        style={styles.galleryButton}
      >
        <Text style={[type.caption, styles.galleryLabel]}>{CAMERA_TEXT.fromGallery}</Text>
      </Pressable>
    </View>
  );
}

/**
 * Trae una foto de la galeria y avisa mientras tanto.
 *
 * El estado de ocupado existe para que no se pueda abrir dos veces el selector
 * del sistema: la segunda invocacion se queda esperando y devuelve una foto que
 * ya nadie espera.
 *
 * @param onImported Se invoca con la foto ya recodificada y sin metadatos.
 * @returns Si hay una importacion en curso y la accion para lanzarla.
 */
function useGalleryImport(onImported: (photo: CapturedPhoto) => void) {
  const [isImporting, setIsImporting] = useState(false);

  const importPhoto = () => {
    setIsImporting(true);
    void importFromGallery()
      .then((photo) => {
        setIsImporting(false);
        if (photo !== null) {
          onImported(photo);
        }
      })
      .catch((error: unknown) => {
        setIsImporting(false);
        console.error('[capture] no se pudo importar la imagen', error);
      });
  };

  return { isImporting, importPhoto };
}

const styles = StyleSheet.create({
  controls: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: gap.md },
  // Los avisos van sobre velo solido y no sobre vidrio: son datos operativos, y
  // ademas el vidrio sobre imagen viva cambia de contraste al mover la camara.
  warning: {
    ...type.caption,
    color: paperDark.textHigh,
    backgroundColor: scrim.strong,
    paddingVertical: gap.xs,
    paddingHorizontal: gap.md,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  galleryButton: {
    minHeight: size.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: gap.lg,
  },
  galleryLabel: { color: paperDark.textHigh },
});
