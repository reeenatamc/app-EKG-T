/**
 * Contrato de digitalizacion e interpretacion.
 *
 * Se disena desde el consumo, igual que AuthService y UploadService: las
 * pantallas necesitan saber en que estado esta un estudio, y cuando esta listo,
 * que senal se recupero y que se observo en ella. No necesitan saber si detras
 * hay dos modelos, un servidor o una simulacion.
 *
 * LA APLICACION NO DIAGNOSTICA. Es la premisa del aviso clinico que el usuario
 * acepta en la introduccion, y aqui se sostiene en el propio tipo: lo que
 * devuelve el servicio son `observations`, no diagnosticos, y cada una lleva
 * `needsReview`. No existe ningun campo que afirme una conclusion clinica,
 * porque un campo asi acabaria pintado como un veredicto.
 *
 * La implementacion real llega en la Etapa 5. Hasta entonces gobierna
 * MockEcgAnalysisService.
 */

import type { EcgSignal } from '@/ecg/signal';

export type AnalysisStatus = 'queued' | 'processing' | 'ready' | 'failed';

/**
 * Causas de que un analisis no salga.
 *
 * Causas, no textos: la interfaz decide como se cuenta cada una.
 */
export type AnalysisFailureReason =
  | 'unreadable-image'
  | 'grid-not-detected'
  | 'unsupported-mount'
  | 'network-unreachable'
  | 'server-error'
  | 'unexpected';

/**
 * Medidas del trazado.
 *
 * Son magnitudes, no juicios: un intervalo QT dura lo que dura. La lectura de
 * si ese valor es normal para este paciente no la hace la aplicacion.
 */
export interface EcgMeasurements {
  readonly heartRateBpm: number;
  readonly prIntervalMs: number;
  readonly qrsDurationMs: number;
  readonly qtIntervalMs: number;
  /** QT corregido por frecuencia. */
  readonly qtcMs: number;
  /** Eje electrico del QRS, en grados. */
  readonly axisDegrees: number;
}

/**
 * Algo observado en el trazado.
 *
 * Deliberadamente NO se llama hallazgo ni diagnostico. `needsReview` no es un
 * adorno: viaja con cada observacion para que ninguna pantalla pueda mostrarla
 * sin saber que hay que confirmarla.
 */
export interface EcgObservation {
  readonly id: string;
  /** Que se observo, en el lenguaje del trazado. */
  readonly label: string;
  /** Sobre que derivaciones se apoya. Permite llevar al usuario a mirarlas. */
  readonly leads: readonly string[];
  /** Confianza del modelo, entre 0 y 1. */
  readonly confidence: number;
  /** Siempre cierto mientras la aplicacion no diagnostique. */
  readonly needsReview: true;
}

export interface EcgAnalysis {
  readonly studyId: string;
  readonly status: AnalysisStatus;
  /** La senal digitalizada. Nula mientras no este lista. */
  readonly signal: EcgSignal | null;
  readonly measurements: EcgMeasurements | null;
  readonly observations: readonly EcgObservation[];
  /** Causa del fallo, si el estado es fallido. */
  readonly failure: AnalysisFailureReason | null;
  /** Momento en que el analisis quedo listo, en ISO 8601. */
  readonly completedAt: string | null;
}

export interface EcgAnalysisService {
  /**
   * Pide el analisis de un estudio ya enviado.
   *
   * @param studyId Identificador del estudio.
   * @returns El analisis en su estado inicial.
   */
  request(studyId: string): Promise<EcgAnalysis>;

  /**
   * Consulta el estado actual de un analisis.
   *
   * No lanza por un estudio que aun no esta: devolver el estado es la respuesta
   * correcta, y esperar es parte del flujo normal.
   *
   * @param studyId Identificador del estudio.
   * @returns El analisis, o null si el servidor no lo conoce.
   */
  get(studyId: string): Promise<EcgAnalysis | null>;
}
