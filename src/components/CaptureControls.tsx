import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CapturedPhoto } from '@/camera/capturePhoto';
import { importFromGallery } from '@/capture/importFromGallery';
import { ShutterButton } from '@/components/ShutterButton';
import { CAMERA_TEXT } from '@/constants/captureText';
import { gap, paperDark, radius, scrim, size } from '@/design/tokens';
import { type } from '@/design/type';
import { useTask } from '@/shell/useTask';

interface CaptureControlsProps {
  readonly isReady: boolean;
  readonly isCapturing: boolean;
  /** Cierto si el ultimo disparo no llego a dar foto. */
  readonly hasCaptureFailed: boolean;
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
 * @param hasCaptureFailed Cierto si el ultimo disparo se quedo sin foto.
 * @param isDim Cierto con poca luz ambiente.
 * @param isTilted Cierto cuando el telefono no esta paralelo al papel.
 * @param onShutter Dispara la captura.
 * @param onImported Se invoca con una foto traida de la galeria.
 * @returns Los controles de captura.
 */
export function CaptureControls({
  isReady,
  isCapturing,
  hasCaptureFailed,
  isDim,
  isTilted,
  onShutter,
  onImported,
}: CaptureControlsProps) {
  const insets = useSafeAreaInsets();
  const gallery = useGalleryImport(onImported);

  return (
    <View style={[styles.controls, { bottom: insets.bottom + gap.xl }]}>
      {isDim ? <Text style={styles.warning}>{CAMERA_TEXT.dimWarning}</Text> : null}
      {isTilted ? <Text style={styles.warning}>{CAMERA_TEXT.tiltWarning}</Text> : null}
      {hasCaptureFailed ? <Text style={styles.warning}>{CAMERA_TEXT.shutterFailure}</Text> : null}
      {gallery.hasFailed ? <Text style={styles.warning}>{CAMERA_TEXT.importFailure}</Text> : null}

      <ShutterButton onPress={onShutter} busy={isCapturing} disabled={!isReady} />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={CAMERA_TEXT.fromGallery}
        onPress={gallery.importPhoto}
        disabled={gallery.isImporting}
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
 * ELEGIR SIN ELEGIR NO ES UN FALLO. `importFromGallery` devuelve null cuando el
 * usuario cierra el selector, y eso resuelve bien: quien se arrepiente de abrir
 * la galeria no ha hecho nada mal y no tiene por que ver un aviso.
 *
 * @param onImported Se invoca con la foto ya recodificada y sin metadatos.
 * @returns El estado de la importacion y la accion para lanzarla.
 */
function useGalleryImport(onImported: (photo: CapturedPhoto) => void) {
  const task = useTask('[capture] no se pudo importar la imagen');

  const importPhoto = () =>
    task.run(async () => {
      const photo = await importFromGallery();

      if (photo !== null) {
        onImported(photo);
      }
    });

  return { isImporting: task.isBusy, hasFailed: task.hasFailed, importPhoto };
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
