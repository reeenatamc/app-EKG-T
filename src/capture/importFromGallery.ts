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
 * CERO: el recorte de partida es la imagen entera. En una foto importada nadie
 * encuadro con la guia, y una imagen importada suele venir ya recortada al
 * electrocardiograma, asi que empezar por dentro corta señal antes de que nadie
 * toque nada.
 *
 * Empezaba en 0.1 para que las esquinas no quedasen pegadas al canto de la
 * pantalla y se pudieran agarrar. El problema que resolvia es real, pero es de
 * pantalla y estaba escrito en fraccion de imagen: el tirador mide 44 px y asoma
 * 22 fuera de la esquina, contra los 16 de margen de la pantalla de revision, o
 * sea seis pixeles de asomo. Para tapar seis se recortaba el diez por ciento de
 * la imagen: 180 px por lado en un ECG de 1800, y 400 en uno de 4000, porque
 * cuanto mejor era la foto mas se comia.
 *
 * Medido: la misma imagen importada perdia las seis derivaciones de los miembros
 * y el digitalizador la leia como un `precordial_6x1`, mientras que fotografiada
 * con la camara salia `standard_3x4_with_r3` y sin un solo aviso.
 *
 * Lo que se paga a cambio son esos seis pixeles del anillo exterior del tirador,
 * asomando por el borde. El circulo interior, que es lo que se ve y se busca con
 * el dedo, mide 18 px y queda entero dentro. Entre incluir fondo de mas y cortar
 * el electrocardiograma, lo primero lo arregla el digitalizador solo y lo segundo
 * pierde derivaciones sin decirlo.
 */
const INITIAL_INSET_RATIO = 0;

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
