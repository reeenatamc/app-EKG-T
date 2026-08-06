import { createStudyId } from '@/capture/createStudyId';
import type { PreparedImage } from '@/capture/prepareStudy';
import { persistStudyImage } from '@/capture/studyFiles';
import type { Calibration, QueuedStudy } from '@/capture/study';
import type { MountId } from '@/camera/mounts';

/** Lo que el usuario decidio sobre el estudio antes de enviarlo. */
export interface StudyDraft {
  readonly mount: MountId;
  readonly calibration: Calibration;
  readonly anonymousId: string;
}

/**
 * Convierte una imagen revisada en un estudio listo para la cola.
 *
 * Traslada la imagen del almacenamiento temporal al privado antes de devolver
 * nada. Ese orden importa: el estudio que entra en la cola ya apunta a un
 * archivo que sobrevive al cierre de la aplicacion, asi que no puede quedar en
 * la cola una entrada que apunte a un archivo que el sistema puede borrar.
 *
 * @param image Imagen ya recortada, tal y como se enviara.
 * @param draft Montaje, calibracion e identificador elegidos.
 * @param capturedAt Momento de la captura.
 * @returns El estudio encolable.
 * @throws {Error} Si la imagen no se puede trasladar, por ejemplo por falta de espacio.
 */
export function submitStudy(
  image: PreparedImage,
  draft: StudyDraft,
  capturedAt: Date,
): QueuedStudy {
  const id = createStudyId();

  return {
    id,
    imageUri: persistStudyImage(image.uri, id),
    imageWidth: image.width,
    imageHeight: image.height,
    metadata: {
      anonymousId: draft.anonymousId,
      capturedAt: capturedAt.toISOString(),
      mount: draft.mount,
      calibration: draft.calibration,
      quad: image.quad,
    },
    status: 'pending',
    attempts: 0,
    lastFailure: null,
  };
}
