import { CameraView } from 'expo-camera';
import { useRef, type RefObject } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cameraMessages } from '@/camera/cameraMessages';
import type { CaptureRequest, CapturedPhoto } from '@/camera/capturePhoto';
import type { Rect, Size } from '@/camera/framing';
import { findMount, type MountId } from '@/camera/mounts';
import { isSideways, type QuarterTurn } from '@/camera/turn';
import { useAmbientLight, type AmbientLight } from '@/camera/useAmbientLight';
import { useCameraCapture } from '@/camera/useCameraCapture';
import { useLargestPictureSize } from '@/camera/useLargestPictureSize';
import { usePreviewFrame } from '@/camera/usePreviewFrame';
import { useTilt, type Tilt } from '@/camera/useTilt';
import { useGalleryImport, type GalleryImport } from '@/capture/useGalleryImport';
import { CameraMessages } from '@/components/CameraMessages';
import { CaptureControls } from '@/components/CaptureControls';
import { IconButton } from '@/components/IconButton';
import { FramingGuide } from '@/components/FramingGuide';
import { MountChips } from '@/components/MountChips';
import { TiltIndicator } from '@/components/TiltIndicator';
import { CAMERA_TEXT } from '@/constants/captureText';
import { playHaptic } from '@/design/haptics';
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
 * SE USA TAMBIEN CON EL TELEFONO DE LADO, y es la postura buena para un registro
 * estandar. La aplicacion sigue bloqueada en vertical; lo que cambia con el giro
 * es la forma del marco, que se alarga a lo largo del telefono, y los textos, que
 * giran para leerse derechos. La foto sale derecha: ver `planCapture`.
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
 * @param onClose Abandona la captura.
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

      <CameraChrome stage={stage} mount={mount} onMountChange={onMountChange} onClose={onClose} />
    </View>
  );
}

interface CameraChromeProps {
  readonly stage: CameraStage;
  readonly mount: MountId;
  readonly onMountChange: (mount: MountId) => void;
  readonly onClose: () => void;
}

/**
 * Todo lo que se dibuja encima de la imagen en vivo.
 *
 * La guia, la fila de arriba —salida y montajes—, los textos que giran y la fila
 * del obturador. Recibe el estado entero porque no decide nada con el, solo lo
 * reparte.
 *
 * @param stage Estado de la camara.
 * @param mount Montaje elegido.
 * @param onMountChange Se invoca al cambiar de montaje.
 * @param onClose Abandona la captura.
 * @returns El chrome de la captura.
 */
function CameraChrome({ stage, mount, onMountChange, onClose }: CameraChromeProps) {
  const { tilt } = stage;

  return (
    <>
      {stage.frame === null ? null : (
        <FramingGuide frame={stage.frame} isAligned={tilt.isAligned} />
      )}
      <TopBar mount={mount} onMountChange={onMountChange} onClose={onClose} />
      <StageMessages stage={stage} mount={mount} />
      <CaptureControls
        isReady={stage.isReady}
        isCapturing={stage.isCapturing}
        turn={tilt.turn}
        onShutter={stage.shoot}
        onImport={stage.gallery.importPhoto}
        level={
          tilt.isAvailable ? <TiltIndicator offsetX={tilt.offsetX} offsetY={tilt.offsetY} /> : null
        }
      />
    </>
  );
}

/**
 * La salida y los montajes, arriba.
 *
 * NO GIRAN. Se usan antes de apuntar, con el telefono todavia en la mano, y una
 * fila de chips que se desplaza en horizontal no tiene forma de girar sin dejar
 * de caber. El aspa es igual en cualquier postura.
 *
 * EL ASPA NO ES DECORACION. Esta ruta se presenta como `fullScreenModal`, que en
 * iOS no se cierra deslizando y no lleva cabecera del router: sin este boton la
 * unica salida era el boton fisico de Android, o sea ninguna en iOS.
 */
function TopBar({ mount, onMountChange, onClose }: Omit<CameraChromeProps, 'stage'>) {
  const insets = useSafeAreaInsets();

  return (
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
  );
}

/**
 * Instruccion, postura y avisos, girados con el telefono.
 *
 * Solo sugiere girar el telefono cuando el montaje es apaisado: un 12x1 es mas
 * alto que ancho y se encuadra mejor de pie.
 */
function StageMessages({ stage, mount }: { readonly stage: CameraStage; readonly mount: MountId }) {
  const insets = useSafeAreaInsets();
  const { frame, container, tilt } = stage;

  if (frame === null || container === null) {
    return null;
  }

  const aspect = findMount(mount).aspect;
  const messages = cameraMessages({
    isAligned: tilt.isAligned,
    tiltMode: tilt.isAvailable ? tilt.mode : null,
    isTilted: tilt.isAvailable && !tilt.isAligned,
    isDim: stage.light.isDim,
    hasCaptureFailed: stage.hasFailed,
    hasImportFailed: stage.gallery.hasFailed,
    suggestSideways: tilt.isAvailable && !isSideways(tilt.turn) && aspect.width > aspect.height,
  });
  const placement = messagePlacement(frame, container, insets.top, tilt.turn);

  return <CameraMessages messages={messages} turn={tilt.turn} {...placement} />;
}

/** Alto de la fila de arriba sin el area segura: margen, boton y respiro. */
const TOP_BAR_HEIGHT = gap.md + size.touchTarget + gap.sm;

/**
 * Hueco minimo entre la fila de arriba y el marco para escribir ahi los textos.
 *
 * Caben la postura, la instruccion y dos avisos. Con menos, los textos van
 * dentro del marco: tapan un poco de vista previa, que no sale en la foto, en
 * lugar de cortarse.
 */
const MIN_MESSAGE_BAND = 140;

/**
 * Donde se escriben los textos.
 *
 * De pie, encima del marco, en el hueco que deja la fila de montajes: ahi no tapan
 * nada. De lado no hay hueco —el marco ocupa casi todo el ancho de la pantalla, que
 * es la altura del telefono girado— y van dentro del marco, pegados a su borde de
 * arriba tal como se ve con el telefono girado.
 *
 * @param frame Marco de encuadre.
 * @param container Contenedor de la vista previa.
 * @param safeTop Area segura de arriba.
 * @param turn Giro del telefono.
 * @returns Area y borde para `CameraMessages`.
 */
function messagePlacement(
  frame: Rect,
  container: Size,
  safeTop: number,
  turn: QuarterTurn,
): { readonly area: Rect; readonly edge: 'top' | 'bottom' } {
  const bandTop = safeTop + TOP_BAR_HEIGHT;
  const band = frame.y - bandTop;

  if (turn === 0 && band >= MIN_MESSAGE_BAND) {
    return { area: { x: 0, y: bandTop, width: container.width, height: band }, edge: 'bottom' };
  }

  return { area: frame, edge: 'top' };
}

/** Lo que la pantalla necesita saber de la camara para pintarse. */
interface CameraStage {
  readonly container: Size | null;
  readonly frame: Rect | null;
  readonly tilt: Tilt;
  readonly light: AmbientLight;
  readonly gallery: GalleryImport;
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
 * Existe para que `CameraScreen` sea solo composicion. El orden entre las
 * llamadas importa: el marco depende del giro, que sale del sensor; el tamano de
 * captura depende de que la camara este lista; y el disparo, del contenedor ya
 * medido y del giro en ese instante.
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
  const tilt = useTilt();
  const { container, frame, handleLayout } = usePreviewFrame(mount, tilt.turn);
  const capture = useCameraCapture(onCaptured);
  const pictureSize = useLargestPictureSize(cameraRef, capture.isReady);
  const light = useAmbientLight();
  const gallery = useGalleryImport(onCaptured);
  const shoot = useShutter(cameraRef, container, frame, tilt.turn, capture.capture);

  return {
    container,
    frame,
    tilt,
    light,
    gallery,
    isReady: capture.isReady,
    isCapturing: capture.isCapturing,
    hasFailed: capture.hasFailed,
    pictureSize,
    handleLayout,
    handlePreviewReady: capture.handlePreviewReady,
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
 * @param turn Giro del telefono al pulsar.
 * @param capture Lanza la captura.
 * @returns La accion a enganchar al obturador.
 */
function useShutter(
  camera: RefObject<CameraView | null>,
  container: Size | null,
  frame: Rect | null,
  turn: QuarterTurn,
  capture: (request: CaptureRequest) => void,
): () => void {
  return () => {
    if (camera.current !== null && container !== null && frame !== null) {
      // Antes de disparar, no despues. El obturador se pulsa mirando el papel:
      // el golpe tiene que llegar con el dedo, no cuando el modulo nativo
      // termine de escribir el archivo.
      playHaptic('shutter');
      capture({ camera: camera.current, container, frame, turn });
    }
  };
}

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
});
