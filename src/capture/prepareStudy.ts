import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { CROPPED_COMPRESSION } from '@/camera/captureConfig';
import type { CapturedPhoto } from '@/camera/capturePhoto';
import type { CropRegion, Size } from '@/camera/framing';
import { quadBounds, translateQuadToOrigin, type Quad } from '@/camera/quad';

/**
 * La imagen tal y como se va a enviar, con sus esquinas ya referidas a ella.
 */
export interface PreparedImage {
  readonly uri: string;
  readonly width: number;
  readonly height: number;
  /** Las cuatro esquinas del papel, en pixeles de esta imagen. */
  readonly quad: Quad;
}

/**
 * Recorta la foto al rectangulo que contiene las cuatro esquinas.
 *
 * SE RECORTA, PERO NO SE ENDEREZA. El recorte solo tira pixeles que estan fuera
 * del papel; no toca ni reescala los que se quedan. La correccion de
 * perspectiva, en cambio, obligaria a remuestrear todos y cada uno de ellos, y
 * el remuestreo es donde se pierde un trazo de un milimetro de ancho. Por eso
 * las esquinas viajan como dato y el servidor endereza sobre la resolucion
 * nativa. Ver la cabecera de camera/homography.ts.
 *
 * Recortar antes de analizar la calidad tambien evita falsos avisos: un reflejo
 * sobre la mesa, fuera del papel, no es un reflejo sobre la retícula.
 *
 * @param photo Foto capturada.
 * @param quad Esquinas del papel, en pixeles de la foto.
 * @returns La imagen recortada y las esquinas referidas a ella.
 * @throws {Error} Si el modulo nativo no puede procesar o escribir la imagen.
 */
export async function cropToQuad(photo: CapturedPhoto, quad: Quad): Promise<PreparedImage> {
  const photoSize: Size = { width: photo.width, height: photo.height };
  const region = toCropRegion(quad, photoSize);

  const rendered = await ImageManipulator.manipulate(photo.uri).crop(region).renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: CROPPED_COMPRESSION,
  });

  return {
    uri: saved.uri,
    width: saved.width,
    height: saved.height,
    quad: translateQuadToOrigin(quad, {
      x: region.originX,
      y: region.originY,
      width: region.width,
      height: region.height,
    }),
  };
}

/**
 * Convierte el cuadrilatero en la region rectangular a recortar.
 *
 * Se redondea hacia afuera —origen hacia abajo, tamano hacia arriba— para que
 * el rectangulo nunca corte una esquina que el usuario coloco justo en el
 * borde. Perder medio pixel de papel es peor que conservar medio de mesa.
 *
 * @param quad Esquinas del papel.
 * @param photo Tamano de la foto, como limite.
 * @returns La region a recortar.
 */
function toCropRegion(quad: Quad, photo: Size): CropRegion {
  const bounds = quadBounds(quad);

  const originX = Math.max(0, Math.floor(bounds.x));
  const originY = Math.max(0, Math.floor(bounds.y));

  return {
    originX,
    originY,
    width: Math.min(Math.ceil(bounds.width), photo.width - originX),
    height: Math.min(Math.ceil(bounds.height), photo.height - originY),
  };
}
