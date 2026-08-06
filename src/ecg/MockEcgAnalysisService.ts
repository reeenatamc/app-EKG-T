import type { MountId } from '@/camera/mounts';
import type {
  EcgAnalysis,
  EcgAnalysisService,
  EcgMeasurements,
  EcgObservation,
} from '@/ecg/EcgAnalysisService';
import { hasRhythmStrip, layoutFor, RECORD_SECONDS, RHYTHM_LEAD } from '@/ecg/leads';
import type { EcgSignal, Lead, LeadName, LeadSegment } from '@/ecg/signal';
import { SIMULATED_HEART_RATE_BPM, synthesizeSegment } from '@/ecg/synthesize';

/**
 * Implementacion simulada de la digitalizacion e interpretacion.
 *
 * Existe para que el visor, el historial y la exportacion se puedan construir y
 * ver funcionando antes de que api-EKG tenga endpoint. Lo unico simulado es de
 * donde salen los datos: los estados por los que pasa un estudio, los huecos de
 * la senal y el sondeo desde la interfaz son reales y se ejercitan igual que en
 * produccion.
 *
 * LOS HUECOS SON DE VERDAD. La senal se construye desde `layoutFor`, asi que en
 * un 3x4 cada derivacion de rejilla tiene exactamente sus 2,5 s y nada mas. Si
 * el visor dibujase una recta a traves del hueco, se veria aqui.
 */

const SAMPLING_RATE_HZ = 500;

/** Cuanto tarda la simulacion en pasar de en cola a procesando. */
const QUEUED_MS = 1200;

/** Cuanto dura la simulacion del procesado. */
const PROCESSING_MS = 4000;

/**
 * Medidas simuladas, coherentes con la senal que genera synthesize.ts.
 *
 * No estan calculadas sobre el trazado: estan escritas para que cuadren con el
 * latido patron. Medir de verdad es trabajo del digitalizador.
 */
const MEASUREMENTS: EcgMeasurements = {
  heartRateBpm: SIMULATED_HEART_RATE_BPM,
  prIntervalMs: 160,
  qrsDurationMs: 90,
  qtIntervalMs: 380,
  qtcMs: 416,
  axisDegrees: 45,
};

const OBSERVATIONS: readonly EcgObservation[] = [
  {
    id: 'sinus-rhythm',
    label: 'Ritmo regular, con onda P precediendo a cada complejo',
    leads: ['II'],
    confidence: 0.94,
    needsReview: true,
  },
  {
    id: 'axis-normal',
    label: 'Eje electrico dentro del rango habitual',
    leads: ['I', 'aVF'],
    confidence: 0.88,
    needsReview: true,
  },
];

/** Analisis en curso, por estudio. La sustituye el servidor en la Etapa 5. */
const analyses = new Map<string, EcgAnalysis>();

/** Temporizadores en marcha, para poder cancelarlos si hiciera falta. */
const timers = new Map<string, ReturnType<typeof setTimeout>[]>();

/**
 * Construye la senal completa de un montaje, con sus huecos.
 *
 * @param mount Montaje del registro.
 * @returns La senal simulada.
 */
function buildSignal(mount: MountId): EcgSignal {
  const bySegment = new Map<LeadName, LeadSegment[]>();

  for (const placement of layoutFor(mount)) {
    const segments = bySegment.get(placement.name) ?? [];
    segments.push({
      startSecond: placement.startSecond,
      values: synthesizeSegment(
        placement.name,
        placement.startSecond,
        placement.durationSeconds,
        SAMPLING_RATE_HZ,
      ),
    });
    bySegment.set(placement.name, segments);
  }

  // Con tira de ritmo, la derivacion elegida si se registro los diez segundos
  // enteros: por eso puede imprimirse continua al pie. Sustituye a su tramo de
  // rejilla, que es el mismo dato recortado.
  if (hasRhythmStrip(mount)) {
    bySegment.set(RHYTHM_LEAD, [
      {
        startSecond: 0,
        values: synthesizeSegment(RHYTHM_LEAD, 0, RECORD_SECONDS, SAMPLING_RATE_HZ),
      },
    ]);
  }

  const leads: Lead[] = [...bySegment.entries()].map(([name, segments]) => ({ name, segments }));

  return { samplingRateHz: SAMPLING_RATE_HZ, durationSeconds: RECORD_SECONDS, leads };
}

function queued(studyId: string): EcgAnalysis {
  return {
    studyId,
    status: 'queued',
    signal: null,
    measurements: null,
    observations: [],
    failure: null,
    completedAt: null,
  };
}

/**
 * Programa el avance simulado del analisis.
 *
 * @param studyId Identificador del estudio.
 * @param mount Montaje, que decide los huecos de la senal.
 */
function scheduleProgress(studyId: string, mount: MountId): void {
  const toProcessing = setTimeout(() => {
    const current = analyses.get(studyId);
    if (current !== undefined) {
      analyses.set(studyId, { ...current, status: 'processing' });
    }
  }, QUEUED_MS);

  const toReady = setTimeout(() => {
    analyses.set(studyId, {
      studyId,
      status: 'ready',
      signal: buildSignal(mount),
      measurements: MEASUREMENTS,
      observations: OBSERVATIONS,
      failure: null,
      completedAt: new Date().toISOString(),
    });
  }, QUEUED_MS + PROCESSING_MS);

  timers.set(studyId, [toProcessing, toReady]);
}

export const mockEcgAnalysisService: EcgAnalysisService = {
  async request(studyId: string): Promise<EcgAnalysis> {
    const existing = analyses.get(studyId);
    if (existing !== undefined) {
      return existing;
    }

    const initial = queued(studyId);
    analyses.set(studyId, initial);
    // El montaje real llega con el estudio; aqui se simula el mas frecuente.
    scheduleProgress(studyId, 'standard-3x4');

    return initial;
  },

  async get(studyId: string): Promise<EcgAnalysis | null> {
    return analyses.get(studyId) ?? null;
  },
};

/**
 * Cancela las simulaciones en marcha.
 *
 * Solo lo usan las pruebas y el desmontaje: sin esto, un temporizador
 * pendiente escribiria sobre un mapa que ya nadie mira.
 */
export function cancelMockAnalyses(): void {
  for (const handles of timers.values()) {
    handles.forEach(clearTimeout);
  }
  timers.clear();
  analyses.clear();
}
