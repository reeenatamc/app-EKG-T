import { loadToken } from '@/auth/tokenStorage';
import type {
  AnalysisFailureReason,
  AnalysisStatus,
  EcgAnalysis,
  EcgAnalysisService,
  EcgMeasurements,
  EcgObservation,
} from '@/ecg/EcgAnalysisService';
import type { EcgSignal, Lead, LeadName, LeadSegment } from '@/ecg/signal';
import { httpRequest, NetworkUnreachableError, reasonFrom } from '@/net/http';

/**
 * Implementacion de la digitalizacion e interpretacion contra api-EKG.
 *
 * TODO LO QUE LLEGA SE COMPRUEBA, campo a campo, y no por desconfianza del
 * servidor: lo que sale de aqui se dibuja como el trazado de un paciente. Una
 * senal a medias no se ve como un error, se ve como un electrocardiograma con
 * menos derivaciones, y nadie puede distinguir eso de un registro que de verdad
 * tenia menos. Ante cualquier cosa que no encaje, esto devuelve un analisis
 * fallido en lugar de uno incompleto.
 *
 * `needsReview` no se lee de la respuesta: se pone a `true` siempre. El contrato
 * lo declara asi -- la aplicacion no diagnostica -- y esa promesa no puede
 * depender de lo que mande un servidor.
 */

const STATUSES: readonly AnalysisStatus[] = ['queued', 'processing', 'ready', 'failed'];

const FAILURE_REASONS: readonly AnalysisFailureReason[] = [
  'unreadable-image',
  'grid-not-detected',
  'unsupported-mount',
  'no-full-length-lead',
  'network-unreachable',
  'server-error',
  'unexpected',
];

const LEAD_NAMES: readonly LeadName[] = [
  'I',
  'II',
  'III',
  'aVR',
  'aVL',
  'aVF',
  'V1',
  'V2',
  'V3',
  'V4',
  'V5',
  'V6',
  'V4R',
  'V5R',
  'V6R',
];

/** Un analisis que no se pudo obtener, en la forma que el contrato exige. */
function failed(studyId: string, failure: AnalysisFailureReason): EcgAnalysis {
  return {
    studyId,
    status: 'failed',
    signal: null,
    measurements: null,
    observations: [],
    failure,
    completedAt: null,
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null;
}

/**
 * Interpreta un tramo continuo de senal.
 *
 * @param value Tramo crudo.
 * @returns El tramo, o null si no encaja.
 */
function segmentFrom(value: unknown): LeadSegment | null {
  const raw = asRecord(value);

  if (raw === null || !isFiniteNumber(raw.startSecond) || !Array.isArray(raw.values)) {
    return null;
  }

  // Un solo valor no numerico invalida el tramo entero: interpolarlo o saltarlo
  // seria inventar una muestra que nadie registro.
  if (!raw.values.every(isFiniteNumber)) {
    return null;
  }

  return { startSecond: raw.startSecond, values: raw.values };
}

/**
 * Interpreta una derivacion con sus tramos.
 *
 * @param value Derivacion cruda.
 * @returns La derivacion, o null si no encaja.
 */
function leadFrom(value: unknown): Lead | null {
  const raw = asRecord(value);

  if (raw === null || !Array.isArray(raw.segments)) {
    return null;
  }

  const name = LEAD_NAMES.find((candidate) => candidate === raw.name);
  const segments = raw.segments.map(segmentFrom);

  if (name === undefined || segments.some((segment) => segment === null)) {
    return null;
  }

  return { name, segments: segments as LeadSegment[] };
}

/**
 * Interpreta la senal digitalizada.
 *
 * @param value Senal cruda, o null si el analisis no la trae.
 * @returns La senal, null si no venia, o undefined si venia rota.
 */
function signalFrom(value: unknown): EcgSignal | null | undefined {
  if (value === null || value === undefined) {
    return null;
  }

  const raw = asRecord(value);

  if (raw === null || !isFiniteNumber(raw.samplingRateHz) || !isFiniteNumber(raw.durationSeconds)) {
    return undefined;
  }

  if (!Array.isArray(raw.leads)) {
    return undefined;
  }

  const leads = raw.leads.map(leadFrom);

  if (leads.some((lead) => lead === null)) {
    return undefined;
  }

  return {
    samplingRateHz: raw.samplingRateHz,
    durationSeconds: raw.durationSeconds,
    leads: leads as Lead[],
  };
}

/**
 * Interpreta las medidas del trazado.
 *
 * Son todas o ninguna: `EcgMeasurements` no tiene forma parcial, y hoy el
 * servidor las devuelve siempre nulas porque el pipeline no delinea ondas.
 *
 * @param value Medidas crudas.
 * @returns Las medidas, o null si no vienen completas.
 */
function measurementsFrom(value: unknown): EcgMeasurements | null {
  const raw = asRecord(value);

  if (raw === null) {
    return null;
  }

  const { heartRateBpm, prIntervalMs, qrsDurationMs, qtIntervalMs, qtcMs, axisDegrees } = raw;

  // Uno a uno, y no sobre un array de los seis, porque comprobar el conjunto no
  // le dice al compilador nada de cada campo por separado.
  if (!isFiniteNumber(heartRateBpm) || !isFiniteNumber(prIntervalMs)) {
    return null;
  }

  if (!isFiniteNumber(qrsDurationMs) || !isFiniteNumber(qtIntervalMs)) {
    return null;
  }

  if (!isFiniteNumber(qtcMs) || !isFiniteNumber(axisDegrees)) {
    return null;
  }

  return { heartRateBpm, prIntervalMs, qrsDurationMs, qtIntervalMs, qtcMs, axisDegrees };
}

/**
 * Interpreta una observacion.
 *
 * @param value Observacion cruda.
 * @returns La observacion, o null si no encaja.
 */
function observationFrom(value: unknown): EcgObservation | null {
  const raw = asRecord(value);

  if (raw === null || typeof raw.id !== 'string' || typeof raw.label !== 'string') {
    return null;
  }

  if (!isFiniteNumber(raw.confidence) || !Array.isArray(raw.leads)) {
    return null;
  }

  return {
    id: raw.id,
    label: raw.label,
    leads: raw.leads.filter((lead): lead is string => typeof lead === 'string'),
    confidence: raw.confidence,
    // Nunca se lee de la respuesta. Ver la cabecera del modulo.
    needsReview: true,
  };
}

/**
 * Interpreta el analisis completo.
 *
 * @param body Cuerpo de la respuesta.
 * @param studyId Estudio consultado.
 * @returns El analisis, o null si la respuesta no era utilizable.
 */
function analysisFrom(body: unknown, studyId: string): EcgAnalysis | null {
  const raw = asRecord(body);

  if (raw === null) {
    return null;
  }

  const status = STATUSES.find((candidate) => candidate === raw.status);
  const signal = signalFrom(raw.signal);

  if (status === undefined || signal === undefined) {
    return null;
  }

  const observations = Array.isArray(raw.observations) ? raw.observations.map(observationFrom) : [];

  if (observations.some((observation) => observation === null)) {
    return null;
  }

  return {
    studyId,
    status,
    signal,
    measurements: measurementsFrom(raw.measurements),
    observations: observations as EcgObservation[],
    failure: FAILURE_REASONS.find((candidate) => candidate === raw.failure) ?? null,
    completedAt: typeof raw.completedAt === 'string' ? raw.completedAt : null,
  };
}

export const httpEcgAnalysisService: EcgAnalysisService = {
  /**
   * Pide el analisis de un estudio ya enviado.
   *
   * Devuelve un analisis fallido en lugar de lanzar, porque quien llama no
   * captura: el contrato promete un analisis siempre, y el usuario puede
   * reintentarlo desde la pantalla del estudio.
   */
  async request(studyId: string): Promise<EcgAnalysis> {
    const token = await loadToken();

    if (token === null) {
      return failed(studyId, 'unexpected');
    }

    try {
      const response = await httpRequest(`/studies/${studyId}/analysis/`, {
        method: 'POST',
        token,
      });

      if (response.status < 200 || response.status >= 300) {
        // Un 404 aqui es un estudio que el servidor no tiene. Pasa con los que
        // la simulacion dio por enviados sin enviarlos, y contarlo como fallo
        // es lo unico que deja al usuario reintentar o descartarlo: devolver
        // "en cola" lo dejaria esperando a algo que no va a llegar nunca.
        return failed(studyId, reasonFrom(response.body, FAILURE_REASONS, 'unexpected'));
      }

      return analysisFrom(response.body, studyId) ?? failed(studyId, 'unexpected');
    } catch (error) {
      if (error instanceof NetworkUnreachableError) {
        return failed(studyId, 'network-unreachable');
      }

      throw error;
    }
  },

  /**
   * Consulta el estado actual de un analisis.
   *
   * SIN RESPUESTA SE DEVUELVE null, NO UN FALLO. Quien sondea conserva lo que
   * ya tenia cuando esto devuelve null y vuelve a preguntar, asi que un corte
   * de red se comporta como lo que es -- una espera mas larga -- en vez de
   * convertirse en un analisis fallido que el usuario tendria que reintentar a
   * mano. La misma respuesta sirve para el 404 que el contrato ya describe.
   */
  async get(studyId: string): Promise<EcgAnalysis | null> {
    const token = await loadToken();

    if (token === null) {
      return null;
    }

    try {
      const response = await httpRequest(`/studies/${studyId}/analysis/`, { token });

      if (response.status < 200 || response.status >= 300) {
        return null;
      }

      return analysisFrom(response.body, studyId);
    } catch (error) {
      if (error instanceof NetworkUnreachableError) {
        // Degradacion que el usuario NO ve: la pantalla sigue diciendo que se
        // esta procesando mientras en realidad no se ha podido preguntar. Se
        // registra porque es la unica forma de distinguir un analisis lento de
        // un sondeo que no llega a ninguna parte.
        console.warn(`[analisis] no se pudo consultar el estudio ${studyId}`, error.cause);
        return null;
      }

      throw error;
    }
  },
};
