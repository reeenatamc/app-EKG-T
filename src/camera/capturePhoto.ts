import type { CameraView, PictureRef } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { CROPPED_COMPRESSION } from '@/camera/captureConfig';
import { planCapture } from '@/camera/captureRegions';
import { reportCapturePhases } from '@/camera/captureTimings';
import type { CropRegion, Rect, Size } from '@/camera/framing';
import type { QuarterTurn } from '@/camera/turn';

/** Foto recortada al area del marco mas su margen, lista para revisar. */
/**
 * De donde salio la imagen.
 *
 * IMPORTA PARA EL RECORTE, no para la trazabilidad. Una foto es una hoja sobre
 * una mesa: alrededor hay fondo, y llevar las esquinas al borde del papel es
 * exactamente lo que hay que hacer. Una imagen de galeria suele ser ya la hoja
 * entera, y ahi la misma instruccion recorta el electrocardiograma.
 *
 * Medido sobre un registro de 1800x649: entero se identifica como standard_3x4
 * con un coste de 0.034, el mejor de todo el corpus; recortado a la rejilla pasa
 * a precordial_3x2, y basta con quitarle la columna de texto de la derecha para
 * que se rompa. La pantalla pedia literalmente "arrastra cada esquina hasta el
 * borde del papel" en los dos casos.
 */
export type PhotoSource = 'camera' | 'gallery';

export interface CapturedPhoto {
  readonly uri: string;
  /** Cual de las dos puertas de entrada trajo esta imagen. */
  readonly source: PhotoSource;
  readonly width: number;
  readonly height: number;
  /**
   * El marco que el usuario encuadro, en pixeles de esta imagen.
   *
   * No coincide con la imagen entera porque se captura un margen alrededor: ver
   * CAPTURE_MARGIN_RATIO. Es el punto de partida de las cuatro esquinas de la
   * revision, de modo que quien encuadro bien no tiene que ajustar nada.
   */
  readonly framedRegion: Rect;
}

export interface CaptureRequest {
  readonly camera: CameraView;
  /** Tamano medido del contenedor de la vista previa, en puntos. */
  readonly container: Size;
  /** Marco visible, en coordenadas del contenedor. */
  readonly frame: Rect;
  /**
   * Como estaba girado el telefono al disparar.
   *
   * Hace falta porque Android gira la foto segun la postura fisica aunque la
   * aplicacion este bloqueada en vertical. Ver `turn.ts`.
   */
  readonly turn: QuarterTurn;
}

/**
 * Captura una foto y la recorta al area del marco mas un margen.
 *
 * El recorte es lo que hace que el area capturada coincida con lo que el
 * usuario encuadro: la vista previa muestra solo una parte del sensor, asi que
 * la foto sin recortar siempre abarca mas de lo que el marco sugiere.
 *
 * @param request Camara, tamano del contenedor y marco visible.
 * @returns La foto recortada, en el almacenamiento temporal de la app.
 * @throws {Error} Si la camara no logra tomar la foto o el recorte nativo falla.
 */
export async function capturePhoto(request: CaptureRequest): Promise<CapturedPhoto> {
  // pictureRef devuelve una referencia a la imagen nativa en lugar de un
  // archivo. Evita codificar la foto completa a JPEG, escribirla en disco,
  // releerla y decodificarla solo para tirar la mayor parte al recortar. Medido
  // en un Redmi Note 9 Pro, ese viaje de ida y vuelta costaba unos 1250 ms.
  const shutterAt = Date.now();
  const picture = await request.camera.takePictureAsync({
    pictureRef: true,
    // Sin EXIF: evita incrustar coordenadas GPS en la imagen de un paciente.
    exif: false,
  });
  const sensorMs = Date.now() - shutterAt;

  const delivered: Size = { width: picture.width, height: picture.height };
  const plan = planCapture(request.container, request.frame, delivered, request.turn);

  const processingAt = Date.now();
  const cropped = await cropToRegion(picture, plan.region, plan.clockwise);
  reportCapturePhases(sensorMs, Date.now() - processingAt);

  return { ...cropped, framedRegion: plan.framedRegion };
}

/**
 * Aplica el recorte, lo endereza si hace falta y guarda el resultado en el
 * directorio temporal.
 *
 * Es la unica codificacion a JPEG de todo el proceso, y actua solo sobre el
 * area recortada, no sobre la foto completa. El giro va despues del recorte por
 * lo mismo: girar la foto entera moveria el doble de pixeles para tirar la
 * mayoria.
 *
 * @param source Referencia a la imagen nativa recien capturada.
 * @param region Region a conservar, en pixeles de la foto.
 * @param clockwise Grados en sentido horario; cero en el caso normal.
 * @returns La foto recortada.
 * @throws {Error} Si el modulo nativo no puede procesar o escribir la imagen.
 */
async function cropToRegion(
  source: PictureRef,
  region: CropRegion,
  clockwise: QuarterTurn,
): Promise<Omit<CapturedPhoto, 'framedRegion'>> {
  const context = ImageManipulator.manipulate(source).crop(region);
  const rendered = await (clockwise === 0 ? context : context.rotate(clockwise)).renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: CROPPED_COMPRESSION,
  });

  return { uri: saved.uri, source: 'camera', width: saved.width, height: saved.height };
}
