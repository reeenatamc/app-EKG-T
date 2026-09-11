import { useUploadQueue } from '@/capture/uploadQueue';
import { useStudyNotes } from '@/ecg/notes';

/**
 * Elimina un estudio del historial, con todo lo que cuelga de el en el telefono.
 *
 * DOS SITIOS, NO UNO. El estudio vive en la cola y su nota en otro almacen; borrar
 * solo el primero dejaria en disco texto escrito sobre un paciente que ya nadie
 * puede ver ni borrar desde la aplicacion.
 *
 * La foto la borra la cola: si el estudio no llego a enviarse sigue en el
 * telefono, y si se envio ya se borro al enviarse. LA COPIA DEL SERVIDOR NO SE
 * TOCA: la aplicacion no tiene como borrarla, y el aviso de confirmacion lo dice.
 *
 * @param id Identificador local del estudio.
 */
export function deleteStudy(id: string): void {
  useUploadQueue.getState().discard(id);
  useStudyNotes.getState().forget(id);
}
