/**
 * Eleccion de la resolucion de captura.
 *
 * Modulo puro, sin React Native ni expo-camera, por el mismo motivo que
 * framing.ts: es una decision que se puede razonar y probar sin dispositivo.
 *
 * Por que existe este archivo. Sin fijar pictureSize, expo-camera captura al
 * tamano por defecto del dispositivo, que en Android rara vez es el maximo del
 * sensor. Para una foto cualquiera da igual; para esta no. La recuperacion de
 * la senal medida sobre este proyecto cae al 26% a resolucion insuficiente y
 * sube al 99% con la imagen a escala adecuada, y esa diferencia no la arregla
 * ningun modelo aguas abajo: o los milimetros de papel llegan con suficientes
 * pixeles, o la senal ya se perdio al disparar.
 */

import type { Size } from '@/camera/framing';

/** Formato que devuelve getAvailablePictureSizesAsync en Android: "4000x3000". */
const SIZE_PATTERN = /^(\d+)x(\d+)$/;

/**
 * Interpreta una resolucion con el formato que publica la camara.
 *
 * Devuelve null en lugar de lanzar porque iOS no siempre entrega pares
 * ancho-alto: puede devolver nombres de preajuste de AVCaptureSession. Un valor
 * que no se entiende no es un error, es un valor que este selector ignora.
 *
 * @param value Cadena publicada por la camara.
 * @returns El tamano en pixeles, o null si la cadena no es un par ancho-alto.
 */
export function parsePictureSize(value: string): Size | null {
  const match = SIZE_PATTERN.exec(value);
  if (match === null) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width === 0 || height === 0) {
    return null;
  }

  return { width, height };
}

/**
 * Elige la resolucion de mayor area entre las que ofrece la camara.
 *
 * Se ordena por area y no por ancho porque un sensor puede publicar tanto 4:3
 * como 16:9, y el 16:9 mas ancho suele tener menos pixeles totales: recorta
 * arriba y abajo en vez de anadir detalle. Lo que interesa aqui es cuantos
 * pixeles caen sobre cada milimetro de papel, y eso lo da el area.
 *
 * La proporcion elegida no rompe el encuadre: computeCropRegion deriva la
 * transformacion del tamano real de la foto, que capturePhoto lee del resultado
 * y no de esta eleccion.
 *
 * @param available Resoluciones publicadas por la camara.
 * @returns La cadena original de la mayor, o null si ninguna es interpretable.
 */
export function selectLargestPictureSize(available: readonly string[]): string | null {
  let best: string | null = null;
  let bestArea = 0;

  for (const candidate of available) {
    const size = parsePictureSize(candidate);
    if (size === null) {
      continue;
    }

    const area = size.width * size.height;
    if (area > bestArea) {
      best = candidate;
      bestArea = area;
    }
  }

  return best;
}
