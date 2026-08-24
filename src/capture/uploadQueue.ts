import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mockUploadService } from '@/capture/MockUploadService';
import {
  enqueue,
  markFailed,
  markUploaded,
  markUploading,
  nextPending,
  remove,
  retry,
} from '@/capture/queue';
import type { QueuedStudy } from '@/capture/study';
import { deleteOrphanImages, deleteStudyImage } from '@/capture/studyFiles';
import { useStoreHydrated } from '@/state/hydration';
import type { UploadService } from '@/capture/UploadService';

/**
 * Cola de subida persistente.
 *
 * Reparte el estudio entre dos almacenes por el mismo criterio que settings.ts:
 * los metadatos son texto pequeno y van a AsyncStorage; la imagen es un archivo
 * de megabytes y va al disco privado, con solo su ruta en los metadatos. Meter
 * una foto en base64 dentro de AsyncStorage funcionaria hasta el dia en que
 * hubiese cuatro estudios pendientes.
 *
 * Las transiciones viven en queue.ts, que es puro y esta probado. Aqui solo
 * quedan los efectos: disco, red y rehidratacion.
 */

/**
 * Servicio de envio en uso.
 *
 * Es una variable de modulo y no una inyeccion por parametro porque la cola es
 * un singleton: sustituirlo en la Etapa 5 es cambiar esta linea.
 */
const uploadService: UploadService = mockUploadService;

/**
 * Cierre para que dos vaciados no corran a la vez.
 *
 * Vive fuera del estado porque no se pinta y no debe provocar renderizados: es
 * un cerrojo, no informacion. Sin el, dos llamadas simultaneas a drain —una del
 * arranque y otra de una captura recien confirmada— enviarian el mismo estudio
 * dos veces.
 */
let isDraining = false;

/** Aplica un cambio a la lista de estudios del almacen. */
type ApplyChange = (change: (studies: readonly QueuedStudy[]) => readonly QueuedStudy[]) => void;

/** Lee la lista de estudios actual. */
type ReadStudies = () => readonly QueuedStudy[];

/**
 * Envia un estudio y refleja el resultado en la cola.
 *
 * @param study Estudio a enviar.
 * @param apply Aplicador de cambios sobre la cola.
 */
async function send(study: QueuedStudy, apply: ApplyChange): Promise<void> {
  apply((studies) => markUploading(studies, study.id));
  const result = await uploadService.send(study);

  if (!result.ok) {
    apply((studies) => markFailed(studies, study.id, result.failure.reason));
    return;
  }

  // El borrado va antes de marcar el estudio como subido. Si se hiciese al
  // reves y el proceso muriese justo en medio, la imagen se quedaria en disco
  // sin nadie que la reclamase, y es la foto de un paciente. En este orden, lo
  // peor que puede pasar es repetir un envio.
  deleteStudyImage(study.imageUri);
  apply((studies) => markUploaded(studies, study.id));
}

/**
 * Envia los pendientes de uno en uno hasta que no quede ninguno.
 *
 * De uno en uno y no en paralelo: son fotos de varios megabytes sobre una
 * conexion que ya se ha demostrado mala, y lanzar tres a la vez las hace
 * competir entre si hasta que expiran todas.
 *
 * @param read Lector de la cola actual.
 * @param apply Aplicador de cambios sobre la cola.
 */
async function drainQueue(read: ReadStudies, apply: ApplyChange): Promise<void> {
  if (isDraining) {
    return;
  }
  isDraining = true;

  try {
    for (let study = nextPending(read()); study !== null; study = nextPending(read())) {
      await send(study, apply);
    }
  } finally {
    isDraining = false;
  }
}

/**
 * Saca un estudio de la cola y borra su imagen.
 *
 * @param id Identificador del estudio.
 * @param read Lector de la cola actual.
 * @param apply Aplicador de cambios sobre la cola.
 */
function discardStudy(id: string, read: ReadStudies, apply: ApplyChange): void {
  const study = read().find((candidate) => candidate.id === id);
  if (study !== undefined) {
    deleteStudyImage(study.imageUri);
  }
  apply((studies) => remove(studies, id));
}

interface UploadQueueState {
  readonly studies: readonly QueuedStudy[];
  /** Encola un estudio y arranca el envio. */
  readonly add: (study: QueuedStudy) => void;
  /** Envia los pendientes, de uno en uno, hasta que no quede ninguno. */
  readonly drain: () => Promise<void>;
  /** Devuelve un estudio fallido a la cola por peticion del usuario. */
  readonly retryStudy: (id: string) => void;
  /** Descarta un estudio y borra su imagen. */
  readonly discard: (id: string) => void;
}

export const useUploadQueue = create<UploadQueueState>()(
  persist(
    (set, get) => {
      const apply: ApplyChange = (change) => {
        set((state) => ({ studies: change(state.studies) }));
      };
      const read: ReadStudies = () => get().studies;

      return {
        studies: [],
        add: (study) => {
          apply((studies) => enqueue(studies, study));
          void get().drain();
        },
        drain: () => drainQueue(read, apply),
        retryStudy: (id) => {
          apply((studies) => retry(studies, id));
          void get().drain();
        },
        discard: (id) => discardStudy(id, read, apply),
      };
    },
    {
      name: 'ekg.uploadQueue',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ studies: state.studies }),

      // Un estudio que estaba enviandose cuando la aplicacion murio se quedo en
      // "uploading". Como nextPending no devuelve nada mientras haya un envio
      // en curso, ese estudio fantasma bloquearia la cola entera para siempre.
      // Se devuelve a pendiente al leerlo del disco, conservando el contador de
      // intentos, que es justo lo que impide que un estudio capaz de matar el
      // proceso se reintente sin fin.
      merge: (persisted, current) => {
        const stored = (persisted as Partial<UploadQueueState> | undefined)?.studies ?? [];

        return {
          ...current,
          studies: stored.map((study) =>
            study.status === 'uploading' ? { ...study, status: 'pending' as const } : study,
          ),
        };
      },

      // La limpieza de huerfanos va dentro de la rehidratacion y no en un
      // efecto de arranque. Si corriese antes de leer el disco, la cola estaria
      // vacia, ningun archivo constaria como referenciado y se borrarian todas
      // las imagenes pendientes de subir.
      onRehydrateStorage: () => (state) => {
        if (state !== undefined) {
          deleteOrphanImages(state.studies.map((study) => study.imageUri));
        }
      },
    },
  ),
);

/**
 * Indica si la cola ya se leyo del disco.
 *
 * Lo consultan Inicio e Historial antes de afirmar nada sobre los estudios
 * guardados. Sin esto, los primeros fotogramas de las dos pantallas describen
 * una cola vacia que solo esta vacia porque el disco no ha llegado todavia.
 *
 * @returns Cierto cuando la rehidratacion ha terminado.
 */
export function useQueueHydrated(): boolean {
  return useStoreHydrated(useUploadQueue);
}
