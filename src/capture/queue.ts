/**
 * Transiciones de la cola de subida.
 *
 * Modulo puro: la cola es una lista y un conjunto de reglas sobre ella, y
 * ninguna de las dos cosas necesita React ni disco para razonarse. El almacen
 * persistente que la usa vive en uploadQueue.ts.
 *
 * La cola existe porque el sitio donde se fotografia un electrocardiograma
 * —una sala, un pasillo, una ambulancia— es justo donde peor va la cobertura.
 * Perder un estudio por eso seria perder el trabajo de ir hasta el paciente.
 */

import type { QueuedStudy, UploadFailureReason } from '@/capture/study';

/**
 * Intentos automaticos antes de dejar de reintentar solo.
 *
 * Pasado ese numero la cola no abandona el estudio: lo deja en fallido y espera
 * a que el usuario lo reintente. Insistir indefinidamente contra un servidor
 * caido gasta bateria y datos sin acercarse al objetivo, y ademas oculta el
 * problema, porque nadie llega a ver que algo va mal.
 */
export const MAX_AUTOMATIC_ATTEMPTS = 3;

/**
 * Anade un estudio al final de la cola.
 *
 * @param queue Cola actual.
 * @param study Estudio a encolar.
 * @returns La cola con el estudio al final.
 */
export function enqueue(queue: readonly QueuedStudy[], study: QueuedStudy): readonly QueuedStudy[] {
  return [...queue, study];
}

/**
 * Sustituye un estudio conservando el orden.
 *
 * @param queue Cola actual.
 * @param id Identificador del estudio.
 * @param change Cambio a aplicar sobre el estudio encontrado.
 * @returns La cola con el estudio actualizado, o la misma cola si no estaba.
 */
function update(
  queue: readonly QueuedStudy[],
  id: string,
  change: (study: QueuedStudy) => QueuedStudy,
): readonly QueuedStudy[] {
  return queue.map((study) => (study.id === id ? change(study) : study));
}

/**
 * Marca un estudio como en curso y le cuenta el intento.
 *
 * El intento se cuenta al empezar y no al fallar: si el proceso muere a mitad
 * del envio —la aplicacion se cierra, el sistema la mata— nadie llegaria a
 * marcar el fallo, y un estudio que reventase el proceso cada vez se
 * reintentaria para siempre.
 *
 * @param queue Cola actual.
 * @param id Identificador del estudio.
 * @returns La cola actualizada.
 */
export function markUploading(queue: readonly QueuedStudy[], id: string): readonly QueuedStudy[] {
  return update(queue, id, (study) => ({
    ...study,
    status: 'uploading',
    attempts: study.attempts + 1,
  }));
}

/**
 * Marca un estudio como subido.
 *
 * @param queue Cola actual.
 * @param id Identificador del estudio.
 * @returns La cola actualizada.
 */
export function markUploaded(queue: readonly QueuedStudy[], id: string): readonly QueuedStudy[] {
  return update(queue, id, (study) => ({ ...study, status: 'uploaded', lastFailure: null }));
}

/**
 * Marca un estudio como fallido y guarda la causa.
 *
 * @param queue Cola actual.
 * @param id Identificador del estudio.
 * @param reason Causa del fallo.
 * @returns La cola actualizada.
 */
export function markFailed(
  queue: readonly QueuedStudy[],
  id: string,
  reason: UploadFailureReason,
): readonly QueuedStudy[] {
  return update(queue, id, (study) => ({ ...study, status: 'failed', lastFailure: reason }));
}

/**
 * Devuelve un estudio fallido a la cola para reintentarlo a mano.
 *
 * Pone el contador de intentos a cero: el usuario que pulsa reintentar suele
 * haber cambiado algo —se ha movido, ha encontrado cobertura— y merece la
 * tanda completa de intentos automaticos otra vez.
 *
 * @param queue Cola actual.
 * @param id Identificador del estudio.
 * @returns La cola actualizada.
 */
export function retry(queue: readonly QueuedStudy[], id: string): readonly QueuedStudy[] {
  return update(queue, id, (study) => ({
    ...study,
    status: 'pending',
    attempts: 0,
    lastFailure: null,
  }));
}

/**
 * Saca un estudio de la cola.
 *
 * @param queue Cola actual.
 * @param id Identificador del estudio.
 * @returns La cola sin ese estudio.
 */
export function remove(queue: readonly QueuedStudy[], id: string): readonly QueuedStudy[] {
  return queue.filter((study) => study.id !== id);
}

/**
 * Elige el siguiente estudio a enviar.
 *
 * Solo devuelve algo si no hay ya un envio en curso: los envios van de uno en
 * uno. Son fotos de varios megabytes sobre una conexion que ya se ha
 * demostrado mala, y lanzar tres a la vez las hace competir entre si hasta que
 * expiran todas.
 *
 * @param queue Cola actual.
 * @returns El estudio a enviar, o null si no toca enviar nada.
 */
export function nextPending(queue: readonly QueuedStudy[]): QueuedStudy | null {
  if (queue.some((study) => study.status === 'uploading')) {
    return null;
  }

  return (
    queue.find((study) => study.status === 'pending' && study.attempts < MAX_AUTOMATIC_ATTEMPTS) ??
    null
  );
}

/**
 * Estudios que el usuario debe ver como pendientes de resolver.
 *
 * @param queue Cola actual.
 * @returns Los que no han llegado a subirse.
 */
export function unresolved(queue: readonly QueuedStudy[]): readonly QueuedStudy[] {
  return queue.filter((study) => study.status !== 'uploaded');
}
