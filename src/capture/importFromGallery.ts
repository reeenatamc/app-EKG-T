import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { CROPPED_COMPRESSION } from '@/camera/captureConfig';
import type { CapturedPhoto } from '@/camera/capturePhoto';

/**
 * Importa un electrocardiograma ya fotografiado desde la galeria.
 *
 * Existe porque la foto no siempre se toma aqui: alguien la recibio por
 * mensajeria, o la hizo antes de instalar la aplicacion, y obligarle a
 * refotografiar una hoja que quiza ya no tiene delante seria absurdo.
 *
 * SE VUELVE A CODIFICAR A PROPOSITO, aunque cueste una generacion de perdida.
 * Una foto de la galeria llega con sus metadatos EXIF intactos, y ahi puede
 * haber coordenadas GPS: la casa del paciente, el hospital, la ambulancia.
 * En la captura propia eso se evita con exif: false; aqui la unica forma de
 * quitarlos es recodificar. Un dato de localizacion adherido a la imagen de un
 * paciente vale mas que un punto de calidad.
 */

/**
 * Fraccion del borde que se deja fuera del cuadrilatero inicial.
 *
 * En una foto importada nadie encuadro con la guia, asi que no hay marco que
 * heredar. Empezar un poco por dentro del borde deja las cuatro esquinas a la
 * vista y arrastrables desde el primer momento, en lugar de pegadas al canto de
 * la pantalla.
 */
const INITIAL_INSET_RATIO = 0.1;

/**
 * Pide una imagen de la galeria y la deja lista para revisar.
 *
 * @returns La foto importada, o null si el usuario cancelo.
 * @throws {Error} Si la imagen no se puede leer o recodificar.
 */
export async function importFromGallery(): Promise<CapturedPhoto | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: 'images',
    // Sin recorte del sistema: el recorte de esta aplicacion es el de las
    // cuatro esquinas, que ademas conserva la perspectiva como dato.
    allowsEditing: false,
    // Maxima calidad disponible en la seleccion; la compresion la decide esta
    // aplicacion al recodificar, con su propio criterio.
    quality: 1,
    exif: false,
  });

  const asset = picked.canceled ? undefined : picked.assets[0];
  if (asset === undefined) {
    return null;
  }

  const rendered = await ImageManipulator.manipulate(asset.uri).renderAsync();
  const saved = await rendered.saveAsync({
    format: SaveFormat.JPEG,
    compress: CROPPED_COMPRESSION,
  });

  const insetX = saved.width * INITIAL_INSET_RATIO;
  const insetY = saved.height * INITIAL_INSET_RATIO;

  return {
    uri: saved.uri,
    width: saved.width,
    height: saved.height,
    framedRegion: {
      x: insetX,
      y: insetY,
      width: saved.width - 2 * insetX,
      height: saved.height - 2 * insetY,
    },
  };
}
