import type { CameraView, PictureRef } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { CAPTURE_MARGIN_RATIO, CROPPED_COMPRESSION } from '@/camera/captureConfig';
import { reportCapturePhases } from '@/camera/captureTimings';
import { computeCropRegion, type CropRegion, type Rect, type Size } from '@/camera/framing';
import { expandRect } from '@/camera/quad';

/** Foto recortada al area del marco mas su margen, lista para revisar. */
export interface CapturedPhoto {
  readonly uri: string;
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

  const photoSize: Size = { width: picture.width, height: picture.height };
  const { region, framedRegion } = computeCaptureRegions(
    request.container,
    request.frame,
    photoSize,
  );

  const processingAt = Date.now();
  const cropped = await cropToRegion(picture, region);
  reportCapturePhases(sensorMs, Date.now() - processingAt);

  return { ...cropped, framedRegion };
}

interface CaptureRegions {
  /** Region a recortar de la foto: el marco mas su margen. */
  readonly region: CropRegion;
  /** El marco original, ya en coordenadas de la region recortada. */
  readonly framedRegion: Rect;
}

/**
 * Deriva la region a recortar y donde queda el marco dentro de ella.
 *
 * Las dos regiones se calculan con la misma funcion probada, computeCropRegion,
 * en lugar de calcular una y deducir la otra por aritmetica: asi el margen no
 * puede introducir un desfase propio.
 *
 * @param container Tamano del contenedor de la vista previa.
 * @param frame Marco visible en coordenadas del contenedor.
 * @param photo Tamano real de la foto capturada.
 * @returns La region a recortar y la posicion del marco dentro de ella.
 */
function computeCaptureRegions(container: Size, frame: Rect, photo: Size): CaptureRegions {
  const containerBounds: Rect = { x: 0, y: 0, ...container };
  const outer = computeCropRegion({
    container,
    frame: expandRect(frame, CAPTURE_MARGIN_RATIO, containerBounds),
    photo,
  });
  const inner = computeCropRegion({ container, frame, photo });

  if (outer.wasClamped) {
    warnAboutClampedRegion(outer.region, photo);
  }

  return {
    region: outer.region,
    framedRegion: {
      x: inner.region.originX - outer.region.originX,
      y: inner.region.originY - outer.region.originY,
      width: inner.region.width,
      height: inner.region.height,
    },
  };
}

/**
 * Aplica el recorte y guarda el resultado en el directorio temporal.
 *
 * Es la unica codificacion a JPEG de todo el proceso, y actua solo sobre el
 * area recortada, no sobre la foto completa.
 *
 * @param source Referencia a la imagen nativa recien capturada.
 * @param region Region a conservar, en pixeles de la foto.
 * @returns La foto recortada.
 * @throws {Error} Si el modulo nativo no puede procesar o escribir la imagen.
 */
async function cropToRegion(
  source: PictureRef,
  region: CropRegion,
): Promise<Omit<CapturedPhoto, 'framedRegion'>> {
  const rendered = await ImageManipulator.manipulate(source).crop(region).renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: CROPPED_COMPRESSION,
  });

  return { uri: saved.uri, width: saved.width, height: saved.height };
}

/**
 * Avisa de que la region calculada no cabia en la foto.
 *
 * Que esto ocurra significa que la capa nativa no coloco la vista previa como
 * asume computeCropRegion. La captura sigue adelante con la region ajustada
 * para no bloquear al usuario, pero queda constancia porque el encuadre
 * resultante no sera el que se mostro en pantalla.
 */
function warnAboutClampedRegion(region: CropRegion, photo: Size): void {
  console.warn(
    '[framing] La region de recorte excedia los limites de la foto y se ajusto. ' +
      'El area capturada puede no coincidir con el marco en este dispositivo.',
    { regionAplicada: region, tamanoFoto: photo },
  );
}
