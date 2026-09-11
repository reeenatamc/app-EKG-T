import type { QueuedStudy, StudyStatus } from '@/capture/study';
import type { EcgAnalysis } from '@/ecg/EcgAnalysisService';

/**
 * En que punto esta un estudio, tal como lo vive quien lo fotografio.
 *
 * UNO SOLO, Y NO DOS. El estudio tiene dos estados tecnicos que avanzan uno
 * detras del otro —el envio y el analisis— y el historial ensenaba el primero
 * hasta que alguien abria el detalle: todo lo enviado ponia "Enviado", estuviese
 * procesandose, listo o fallido. Para quien mira la lista eso no es informacion.
 * Lo que quiere saber es si puede leerlo, si tiene que esperar, o si tiene que
 * hacer algo.
 *
 * - `waiting`: en el telefono, todavia sin enviar.
 * - `sending`: enviandose ahora.
 * - `analyzing`: en el servidor, sin lectura todavia.
 * - `ready`: con lectura.
 * - `failed`: no salio, sea el envio o la lectura. Para quien mira la lista son
 *   el mismo aviso —aqui hay algo que atender— y la causa concreta se lee dentro.
 */
export type StudyState = 'waiting' | 'sending' | 'analyzing' | 'ready' | 'failed';

/**
 * Resuelve el estado visible de un estudio.
 *
 * @param upload Estado del envio.
 * @param analysis Analisis conocido, o undefined si todavia no ha llegado.
 * @returns El estado que hay que ensenar.
 */
export function studyState(upload: StudyStatus, analysis: EcgAnalysis | undefined): StudyState {
  if (upload === 'pending') {
    return 'waiting';
  }
  if (upload === 'uploading') {
    return 'sending';
  }
  if (upload === 'failed') {
    return 'failed';
  }

  // Enviado. Sin analisis conocido todavia es lo mismo que en cola: la sesion lo
  // pide nada mas enviarse, asi que lo que falta es la respuesta, no la peticion.
  if (analysis === undefined || analysis.status === 'queued' || analysis.status === 'processing') {
    return 'analyzing';
  }

  return analysis.status === 'ready' ? 'ready' : 'failed';
}

/** Cuantos estudios hay en cada punto, agrupados como se leen en el inicio. */
export interface StudyCounts {
  readonly ready: number;
  /** En espera, enviandose o analizandose: todo lo que todavia va a cambiar solo. */
  readonly inProgress: number;
  readonly failed: number;
}

/**
 * Cuenta los estudios por estado.
 *
 * TRES GRUPOS Y NO CINCO. En el inicio lo que importa es cuanto hay para leer,
 * cuanto esta en marcha y cuanto pide atencion. Distinguir "en espera" de
 * "enviando" de "analizando" es lo que hace el historial, fila por fila; aqui
 * serian tres cifras pequenas que se suman de cabeza.
 *
 * @param studies Estudios de la cola.
 * @param byStudy Analisis conocidos, por identificador remoto.
 * @returns Los tres recuentos.
 */
export function studyCounts(
  studies: readonly QueuedStudy[],
  byStudy: Readonly<Record<string, EcgAnalysis>>,
): StudyCounts {
  const states = studies.map((study) =>
    studyState(study.status, study.remoteId === null ? undefined : byStudy[study.remoteId]),
  );

  return {
    ready: states.filter((state) => state === 'ready').length,
    failed: states.filter((state) => state === 'failed').length,
    inProgress: states.filter((state) => state !== 'ready' && state !== 'failed').length,
  };
}
