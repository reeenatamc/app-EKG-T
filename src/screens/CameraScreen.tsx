import { CameraView } from 'expo-camera';
import { useRef, type RefObject } from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CaptureRequest, CapturedPhoto } from '@/camera/capturePhoto';
import type { Rect, Size } from '@/camera/framing';
import type { MountId } from '@/camera/mounts';
import { useAmbientLight } from '@/camera/useAmbientLight';
import { useCameraCapture } from '@/camera/useCameraCapture';
import { useLargestPictureSize } from '@/camera/useLargestPictureSize';
import { usePreviewFrame } from '@/camera/usePreviewFrame';
import { useTilt, type Tilt } from '@/camera/useTilt';
import { CaptureControls } from '@/components/CaptureControls';
import { FramingGuide } from '@/components/FramingGuide';
import { MountChips } from '@/components/MountChips';
import { TiltIndicator } from '@/components/TiltIndicator';
import { gap, paperDark, size } from '@/design/tokens';

interface CameraScreenProps {
  readonly onCaptured: (photo: CapturedPhoto) => void;
  readonly mount: MountId;
  readonly onMountChange: (mount: MountId) => void;
}

/**
 * Pantalla de captura: vista previa, guia de encuadre y obturador.
 *
 * Esta pantalla es oscura siempre y no sigue al tema de la aplicacion. No es
 * una decision estetica: una interfaz clara a pantalla completa rebota sobre el
 * papel satinado del electrocardiograma, mete reflejos en la foto y desajusta la
 * exposicion de la vista previa. El motivo es optico y por eso no se negocia
 * con la preferencia del usuario.
 *
 * El obturador queda deshabilitado hasta que la camara avisa de que esta lista,
 * porque tomar una foto antes falla en Android y devuelve un fotograma viejo en
 * iOS.
 *
 * QUE SE AVISA AQUI Y QUE NO. La inclinacion y la poca luz se miden con
 * sensores y salen en vivo. El reflejo no: expo-camera no da acceso a los
 * fotogramas de la vista previa, asi que no hay nada que analizar hasta que la
 * foto existe. Se detecta en la revision, sobre la imagen ya tomada y antes de
 * confirmar, que sigue cumpliendo avisar antes de subir.
 *
 * @param onCaptured Se invoca con la foto ya recortada al marco.
 * @param mount Montaje elegido, que decide la forma del marco.
 * @param onMountChange Se invoca al cambiar de montaje.
 * @returns La pantalla de captura.
 */
export function CameraScreen({ onCaptured, mount, onMountChange }: CameraScreenProps) {
  const cameraRef = useRef<CameraView>(null);
  const { container, frame, handleLayout } = usePreviewFrame(mount);
  const { isReady, isCapturing, capture, handlePreviewReady } = useCameraCapture(onCaptured);
  const pictureSize = useLargestPictureSize(cameraRef, isReady);
  const tilt = useTilt();
  const light = useAmbientLight();
  const shoot = useShutter(cameraRef, container, frame, capture);

  return (
    <View style={styles.container} onLayout={handleLayout}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        pictureSize={pictureSize}
        onCameraReady={handlePreviewReady}
      />

      <CameraOverlay frame={frame} tilt={tilt} mount={mount} onMountChange={onMountChange} />

      <CaptureControls
        isReady={isReady}
        isCapturing={isCapturing}
        isDim={light.isDim}
        isTilted={tilt.isAvailable && !tilt.isAligned}
        onShutter={shoot}
        onImported={onCaptured}
      />
    </View>
  );
}

/**
 * Devuelve la accion del obturador.
 *
 * Ignora el toque mientras falte algo. Sin contenedor medido no hay marco, y
 * sin marco el recorte no tendria con que corresponderse: capturar entonces
 * daria un encuadre que el usuario no ha llegado a ver.
 *
 * @param camera Referencia a la vista de camara.
 * @param container Contenedor medido, o null antes del primer diseno.
 * @param frame Marco de encuadre, o null antes del primer diseno.
 * @param capture Lanza la captura.
 * @returns La accion a enganchar al obturador.
 */
function useShutter(
  camera: RefObject<CameraView | null>,
  container: Size | null,
  frame: Rect | null,
  capture: (request: CaptureRequest) => void,
): () => void {
  return () => {
    if (camera.current !== null && container !== null && frame !== null) {
      capture({ camera: camera.current, container, frame });
    }
  };
}

interface CameraOverlayProps {
  readonly frame: Rect | null;
  readonly tilt: Tilt;
  readonly mount: MountId;
  readonly onMountChange: (mount: MountId) => void;
}

/**
 * Lo que se superpone a la imagen en vivo.
 *
 * Guia de encuadre, eleccion de montaje y nivel de burbuja. Los tres son datos
 * operativos, asi que van en trazo solido sobre velo y no en vidrio: el vidrio
 * sobre imagen viva cambia de contraste cada vez que se mueve la camara, justo
 * cuando hace falta leerlo.
 */
function CameraOverlay({ frame, tilt, mount, onMountChange }: CameraOverlayProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      {frame === null ? null : <FramingGuide frame={frame} isAligned={tilt.isAligned} />}

      <View style={[styles.top, { paddingTop: insets.top + gap.md }]}>
        <MountChips value={mount} onChange={onMountChange} />
      </View>

      {tilt.isAvailable ? (
        <View style={[styles.level, { top: insets.top + LEVEL_TOP_OFFSET }]}>
          <TiltIndicator offsetX={tilt.offsetX} offsetY={tilt.offsetY} mode={tilt.mode} />
        </View>
      ) : null}
    </>
  );
}

/** Deja el nivel por debajo de la fila de montajes, sin solaparla. */
const LEVEL_TOP_OFFSET = gap.md + size.touchTarget + gap.xl;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: paperDark.canvas },
  top: { position: 'absolute', left: 0, right: 0, top: 0 },
  level: { position: 'absolute', right: gap.lg },
});
