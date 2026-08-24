/**
 * Que puede hacer el usuario con un estudio segun su estado.
 *
 * Modulo puro: la regla depende del estado y de nada mas, y tenerla escrita una
 * sola vez evita que la fila del historial y cualquier pantalla futura discrepen
 * sobre cuando se puede tocar un estudio.
 *
 * EXISTE PORQUE LA REGLA ESTABA IMPLICITA Y A MEDIAS. La cola sabia reintentar y
 * descartar desde el primer dia —`retryStudy` y `discard` en `uploadQueue.ts`—,
 * pero ninguna pantalla las llamaba: la unica fila que se renderiza solo sabia
 * abrir. Un estudio que agotaba sus tres intentos automaticos se quedaba en la
 * lista para siempre, sin forma de reintentarlo ni de borrarlo.
 */

import type { QueuedStudy } from '@/capture/study';

/** Las tres salidas de un estudio de la lista. */
export interface StudyActions {
  /** Abrir el detalle. Solo tiene sentido si hay analisis que mirar. */
  readonly canOpen: boolean;
  /** Devolver a la cola un envio que fallo. */
  readonly canRetry: boolean;
  /** Borrar el estudio y su imagen del dispositivo. */
  readonly canDiscard: boolean;
}

/**
 * Decide que se puede hacer con un estudio.
 *
 * ABRIR SOLO SI SE ENVIO. Antes de eso no hay analisis que mirar, y un toque que
 * no lleva a ningun sitio se lee como una averia.
 *
 * REINTENTAR Y DESCARTAR SOLO SI FALLO, y las dos por el mismo motivo: son las
 * salidas de un estudio **atascado**. Uno en espera o en curso se resuelve solo,
 * y ofrecer ahi un boton de reintentar invita a pulsarlo y a duplicar el envio;
 * uno en curso ademas esta leyendo su propia imagen del disco, asi que borrarla
 * bajo sus pies romperia el envio en marcha. Uno ya enviado no se descarta desde
 * aqui: su copia esta en el servidor y quitarlo de la lista seria otra accion,
 * con otras consecuencias y otro nombre.
 *
 * @param study Estudio de la lista.
 * @returns Las acciones disponibles.
 */
export function studyActions(study: QueuedStudy): StudyActions {
  const hasFailed = study.status === 'failed';

  return {
    canOpen: study.status === 'uploaded',
    canRetry: hasFailed,
    canDiscard: hasFailed,
  };
}
