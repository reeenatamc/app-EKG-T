import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import { CROPPED_COMPRESSION } from '@/camera/captureConfig';
import type { CapturedPhoto } from '@/camera/capturePhoto';
import { turnRectCounterClockwise } from '@/camera/turn';

/**
 * Gira una foto un cuarto de vuelta en sentido horario.
 *
 * Para cuando la foto llega de lado o boca abajo: la camara la endereza sola
 * segun como se sostenia el telefono, pero si estaba plano sobre la mesa desde
 * que se abrio no hay giro que leer, y una imagen de galeria viene como venga.
 *
 * El marco encuadrado gira con la foto, para que las esquinas de la revision
 * sigan partiendo del mismo trozo de papel. Horario es antihorario de tres
 * cuartos, que es el sentido en que sabe girar `turnRectCounterClockwise`.
 *
 * Vuelve a codificar a JPEG con la misma compresion que la captura. Es una
 * segunda codificacion y cuesta algo de fidelidad, pero solo la paga quien gira,
 * y enviar un registro de lado cuesta la lectura entera.
 *
 * @param photo Foto a girar. No se borra aqui: lo decide quien la sustituye.
 * @returns La foto girada, en un archivo nuevo.
 * @throws {Error} Si el modulo nativo no puede girar o escribir la imagen.
 */
export async function rotatePhoto(photo: CapturedPhoto): Promise<CapturedPhoto> {
  const rendered = await ImageManipulator.manipulate(photo.uri).rotate(90).renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: CROPPED_COMPRESSION,
  });

  return {
    uri: saved.uri,
    source: photo.source,
    width: saved.width,
    height: saved.height,
    framedRegion: turnRectCounterClockwise(
      photo.framedRegion,
      { width: photo.width, height: photo.height },
      270,
    ),
  };
}
