/**
 * Donde vive la imagen de un estudio mientras espera a subirse.
 *
 * Hay una tension real entre dos requisitos y esta resuelta aqui, a la vista.
 *
 * La regla del proyecto es que la foto no salga del almacenamiento temporal de
 * la aplicacion. Pero la cola tiene que sobrevivir al cierre, y el directorio
 * de cache es exactamente el que Android vacia cuando le falta espacio: una
 * cola en cache pierde estudios en silencio, que es el peor fallo imaginable
 * aqui, porque nadie se entera hasta que va a buscar el estudio y no esta.
 *
 * El acuerdo es este: la imagen vive en el directorio de documentos, que sigue
 * siendo privado de la aplicacion —ni la galeria, ni otras aplicaciones, ni el
 * escaneo de medios lo ven— y se borra en cuanto el servidor confirma que la
 * recibio. Persiste lo que dura su envio y ni un minuto mas. El espiritu de la
 * regla se respeta: la foto de un paciente no se acumula en el dispositivo.
 */

import { Directory, File, Paths } from 'expo-file-system';

const STUDIES_DIRECTORY_NAME = 'studies';

/**
 * Devuelve el directorio de estudios, creandolo si hace falta.
 *
 * @returns El directorio privado donde esperan las imagenes por subir.
 */
function studiesDirectory(): Directory {
  const directory = new Directory(Paths.document, STUDIES_DIRECTORY_NAME);

  if (!directory.exists) {
    directory.create({ intermediates: true });
  }

  return directory;
}

/**
 * Traslada la foto recien capturada al almacenamiento que sobrevive al cierre.
 *
 * Traslada en lugar de copiar, a proposito: una copia dejaria la imagen del
 * paciente duplicada en cache hasta que el sistema decidiese limpiarla.
 *
 * @param temporaryUri Ruta de la foto en el almacenamiento temporal.
 * @param studyId Identificador del estudio, que da nombre al archivo.
 * @returns La ruta definitiva mientras dure la espera.
 * @throws {Error} Si el traslado falla, por ejemplo por falta de espacio.
 */
export function persistStudyImage(temporaryUri: string, studyId: string): string {
  const source = new File(temporaryUri);
  const destination = new File(studiesDirectory(), `${studyId}.jpg`);

  source.moveSync(destination, { overwrite: true });

  return destination.uri;
}

/**
 * Borra la imagen de un estudio.
 *
 * No falla si el archivo ya no esta: el objetivo es que deje de existir, y si
 * alguien se adelanto el objetivo ya se cumplio.
 *
 * @param uri Ruta de la imagen.
 */
export function deleteStudyImage(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    // Que no se pueda borrar no debe tumbar la subida que acaba de salir bien.
    // Se registra porque una imagen que sobrevive a su estudio es un resto de
    // dato clinico en el dispositivo, y eso hay que poder verlo en el registro.
    console.warn('[studyFiles] no se pudo borrar la imagen del estudio', { uri, error });
  }
}

/**
 * Borra las imagenes que ya no pertenecen a ningun estudio de la cola.
 *
 * Hace falta porque los dos almacenes pueden desincronizarse: la imagen se
 * traslada al disco y la cola se guarda despues, asi que un cierre inoportuno
 * entre ambos pasos deja un archivo sin dueno. Sin esta limpieza, esos restos
 * se acumularian indefinidamente, y son fotos de pacientes.
 *
 * @param referencedUris Rutas que si tienen estudio en la cola.
 * @returns Cuantas imagenes huerfanas se borraron.
 */
export function deleteOrphanImages(referencedUris: readonly string[]): number {
  const referenced = new Set(referencedUris);
  let removed = 0;

  try {
    for (const entry of studiesDirectory().list()) {
      if (entry instanceof File && !referenced.has(entry.uri)) {
        entry.delete();
        removed += 1;
      }
    }
  } catch (error) {
    console.warn('[studyFiles] no se pudo limpiar el directorio de estudios', error);
  }

  return removed;
}
