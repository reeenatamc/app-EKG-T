import { File } from 'expo-file-system';

/**
 * Borra del almacenamiento temporal la foto que el usuario descarto.
 *
 * Sin esto, cada intento fallido deja un JPEG de varios cientos de kilobytes en
 * la cache. El sistema operativo acaba vaciando ese directorio, pero puede
 * tardar dias, y mientras tanto la aplicacion ocupa espacio con fotos que nadie
 * va a mirar.
 *
 * Solo se borra al descartar. La foto confirmada se conserva porque es la que
 * consumira la historia de envio.
 *
 * @param photo Imagen descartada. Basta con su ruta: sirve tanto para la foto
 *   recien capturada como para el recorte intermedio de la revision.
 */
export function discardCapture(photo: { readonly uri: string }): void {
  const file = new File(photo.uri);

  if (!file.exists) {
    return;
  }

  try {
    file.delete();
  } catch (error) {
    // Fallar al limpiar no debe impedir volver a la camara: es mantenimiento,
    // no parte del flujo. El sistema acabara vaciando el directorio temporal.
    console.warn('[capture] no se pudo borrar la foto descartada', error);
  }
}
