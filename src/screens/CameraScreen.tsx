import { CameraView } from 'expo-camera';
import { useRef, type RefObject } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CaptureRequest, CapturedPhoto } from '@/camera/capturePhoto';
import type { Rect, Size } from '@/camera/framing';
import type { MountId } from '@/camera/mounts';
import { useAmbientLight, type AmbientLight } from '@/camera/useAmbientLight';
import { useCameraCapture } from '@/camera/useCameraCapture';
import { useLargestPictureSize } from '@/camera/useLargestPictureSize';
import { usePreviewFrame } from '@/camera/usePreviewFrame';
import { useTilt, type Tilt } from '@/camera/useTilt';
import { CaptureControls } from '@/components/CaptureControls';
import { IconButton } from '@/components/IconButton';
import { FramingGuide } from '@/components/FramingGuide';
import { MountChips } from '@/components/MountChips';
import { TiltIndicator } from '@/components/TiltIndicator';
import { CAMERA_TEXT } from '@/constants/captureText';
import { gap, paperDark, scrim, size } from '@/design/tokens';

interface CameraScreenProps {
  readonly onCaptured: (photo: CapturedPhoto) => void;
  readonly mount: MountId;
  readonly onMountChange: (mount: MountId) => void;
  /** Abandona la captura y devuelve al sitio del que se vino. */
  readonly onClose: () => void;
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
export function CameraScreen({ onCaptured, mount, onMountChange, onClose }: CameraScreenProps) {
  // La referencia se crea aqui y se le presta al gancho, en vez de nacer dentro
  // y volver en el paquete: una referencia dentro del objeto de estado convierte
  // cualquier lectura de ese objeto en una lectura de referencia durante el
  // renderizado, que es justo lo que la regla `react-hooks/refs` prohibe.
  const cameraRef = useRef<CameraView>(null);
  const stage = useCameraStage(cameraRef, mount, onCaptured);

  return (
    <View style={styles.container} onLayout={stage.handleLayout}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        pictureSize={stage.pictureSize}
        onCameraReady={stage.handlePreviewReady}
      />

      <CameraChrome
        stage={stage}
        mount={mount}
        onMountChange={onMountChange}
        onClose={onClose}
        onImported={onCaptured}
      />
    </View>
  );
}

interface CameraChromeProps {
  readonly stage: CameraStage;
  readonly mount: MountId;
  readonly onMountChange: (mount: MountId) => void;
  readonly onClose: () => void;
  readonly onImported: (photo: CapturedPhoto) => void;
}

/**
 * Todo lo que se dibuja encima de la imagen en vivo.
 *
 * Agrupa el velo de arriba y los controles de abajo para que la pantalla se lea
 * como lo que es: una vista previa y su chrome. Recibe el estado entero porque
 * no decide nada con el, solo lo reparte entre sus dos mitades.
 *
 * @param stage Estado de la camara.
 * @param mount Montaje elegido.
 * @param onMountChange Se invoca al cambiar de montaje.
 * @param onClose Abandona la captura.
 * @param onImported Se invoca con una foto traida de la galeria.
 * @returns El chrome de la captura.
 */
function CameraChrome({ stage, mount, onMountChange, onClose, onImported }: CameraChromeProps) {
  return (
    <>
      <CameraOverlay
        frame={stage.frame}
        tilt={stage.tilt}
        mount={mount}
        onMountChange={onMountChange}
        onClose={onClose}
      />

      <CaptureControls
        isReady={stage.isReady}
        isCapturing={stage.isCapturing}
        hasCaptureFailed={stage.hasFailed}
        isDim={stage.light.isDim}
        isTilted={stage.tilt.isAvailable && !stage.tilt.isAligned}
        onShutter={stage.shoot}
        onImported={onImported}
      />
    </>
  );
}

/** Lo que la pantalla necesita saber de la camara para pintarse. */
interface CameraStage {
  readonly frame: Rect | null;
  readonly tilt: Tilt;
  readonly light: AmbientLight;
  readonly isReady: boolean;
  readonly isCapturing: boolean;
  readonly hasFailed: boolean;
  readonly pictureSize: string | undefined;
  readonly handleLayout: (event: LayoutChangeEvent) => void;
  readonly handlePreviewReady: () => void;
  readonly shoot: () => void;
}

/**
 * Reune la fontaneria de la camara: referencia, medidas, sensores y disparo.
 *
 * Existe para que `CameraScreen` sea solo composicion. Siete llamadas a hooks
 * mas la composicion no caben en una funcion legible, y separarlas ademas deja
 * claro que el orden entre ellas si importa: el tamano de captura depende de que
 * la camara este lista, y el disparo depende del contenedor ya medido.
 *
 * @param cameraRef Referencia a la vista de camara, creada por la pantalla.
 * @param mount Montaje elegido, que decide la forma del marco.
 * @param onCaptured Se invoca con la foto ya recortada al marco.
 * @returns Todo lo que la pantalla necesita para pintarse.
 */
function useCameraStage(
  cameraRef: RefObject<CameraView | null>,
  mount: MountId,
  onCaptured: (photo: CapturedPhoto) => void,
): CameraStage {
  const { container, frame, handleLayout } = usePreviewFrame(mount);
  const { isReady, isCapturing, hasFailed, capture, handlePreviewReady } =
    useCameraCapture(onCaptured);
  const pictureSize = useLargestPictureSize(cameraRef, isReady);
  const tilt = useTilt();
  const light = useAmbientLight();
  const shoot = useShutter(cameraRef, container, frame, capture);

  return {
    frame,
    tilt,
    light,
    isReady,
    isCapturing,
    hasFailed,
    pictureSize,
    handleLayout,
    handlePreviewReady,
    shoot,
  };
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
  readonly onClose: () => void;
}

/**
 * Lo que se superpone a la imagen en vivo.
 *
 * Guia de encuadre, eleccion de montaje, nivel de burbuja y la salida. Los
 * cuatro son datos o controles operativos, asi que van en trazo solido sobre
 * velo y no en vidrio: el vidrio sobre imagen viva cambia de contraste cada vez
 * que se mueve la camara, justo cuando hace falta leerlo.
 *
 * EL ASPA NO ES DECORACION. Esta ruta se presenta como `fullScreenModal`, que en
 * iOS no se cierra deslizando y no lleva cabecera del router: sin este boton la
 * unica salida era el boton fisico de Android, o sea ninguna en iOS.
 */
function CameraOverlay({ frame, tilt, mount, onMountChange, onClose }: CameraOverlayProps) {
  const insets = useSafeAreaInsets();

  return (
    <>
      {frame === null ? null : <FramingGuide frame={frame} isAligned={tilt.isAligned} />}

      <View style={[styles.top, { paddingTop: insets.top + gap.md }]}>
        <IconButton
          icon="close"
          label={CAMERA_TEXT.closeLabel}
          onPress={onClose}
          color={paperDark.textHigh}
          background={scrim.strong}
        />
        <View style={styles.mounts}>
          <MountChips value={mount} onChange={onMountChange} />
        </View>
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
  // El aspa y los montajes comparten fila: la franja de arriba es la unica
  // banda libre que deja la guia de encuadre, y dos bandas apiladas se comerian
  // el encuadre que el usuario tiene que ver.
  top: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: gap.lg,
  },
  // Los montajes se quedan con el ancho sobrante y siguen desplazandose dentro.
  mounts: { flex: 1 },
  level: { position: 'absolute', right: gap.lg },
});
