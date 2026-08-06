/**
 * Generador de senal sintetica para datos simulados.
 *
 * Modulo puro y determinista: la misma entrada da siempre la misma senal, sin
 * azar. Eso permite probarlo y, sobre todo, que una captura de pantalla de la
 * aplicacion sea reproducible.
 *
 * ESTO NO ES UNA SENAL REAL y no pretende serlo. Es una suma de campanas de
 * Gauss con las posiciones y anchuras aproximadas de una onda P, un complejo QRS
 * y una onda T. Sirve para que el visor tenga algo con forma de
 * electrocardiograma mientras no exista el digitalizador; ninguna medida
 * calculada sobre ella significa nada clinicamente.
 */

import type { LeadName } from '@/ecg/signal';

/** Una componente del latido: una campana con su altura, su centro y su anchura. */
interface Wave {
  readonly amplitudeMv: number;
  readonly centreSecond: number;
  readonly widthSecond: number;
}

/**
 * Las cinco deflexiones de un latido normal, en la derivacion II.
 *
 * Las posiciones son las habituales dentro del ciclo: la P precede al QRS unos
 * 160 ms —el intervalo PR—, el QRS dura unos 90 ms y la T se separa del QRS
 * dejando el segmento ST.
 */
const BEAT: readonly Wave[] = [
  { amplitudeMv: 0.15, centreSecond: 0.1, widthSecond: 0.025 },
  { amplitudeMv: -0.1, centreSecond: 0.16, widthSecond: 0.008 },
  { amplitudeMv: 1.0, centreSecond: 0.2, widthSecond: 0.009 },
  { amplitudeMv: -0.25, centreSecond: 0.23, widthSecond: 0.011 },
  { amplitudeMv: 0.3, centreSecond: 0.4, widthSecond: 0.06 },
];

/**
 * Cuanto se parece cada derivacion a la II, entre -1 y 1.
 *
 * Aproxima el hecho de que cada derivacion mira el corazon desde un angulo
 * distinto. aVR es negativa porque mira desde el hombro derecho y ve alejarse el
 * frente de despolarizacion; V1 y V2 son predominantemente negativas porque
 * quedan sobre el ventriculo derecho.
 */
const LEAD_PROJECTION: Record<LeadName, number> = {
  I: 0.7,
  II: 1,
  III: 0.4,
  aVR: -0.8,
  aVL: 0.2,
  aVF: 0.7,
  V1: -0.4,
  V2: -0.2,
  V3: 0.4,
  V4: 1,
  V5: 0.9,
  V6: 0.7,
  V4R: -0.5,
  V5R: -0.3,
  V6R: 0.2,
};

/** Frecuencia cardiaca de la senal simulada, en latidos por minuto. */
export const SIMULATED_HEART_RATE_BPM = 72;

const SECONDS_PER_MINUTE = 60;

/**
 * Valor del latido patron en un instante del ciclo.
 *
 * @param secondInCycle Segundo dentro del ciclo cardiaco.
 * @returns Amplitud en milivoltios, en la referencia de la derivacion II.
 */
export function beatAt(secondInCycle: number): number {
  return BEAT.reduce((total, wave) => {
    const distance = (secondInCycle - wave.centreSecond) / wave.widthSecond;
    return total + wave.amplitudeMv * Math.exp(-0.5 * distance * distance);
  }, 0);
}

/**
 * Genera las muestras de un tramo de una derivacion.
 *
 * @param lead Derivacion a generar.
 * @param startSecond Segundo del registro en que empieza el tramo.
 * @param durationSeconds Cuanto dura el tramo.
 * @param samplingRateHz Frecuencia de muestreo.
 * @returns Las muestras en milivoltios.
 */
export function synthesizeSegment(
  lead: LeadName,
  startSecond: number,
  durationSeconds: number,
  samplingRateHz: number,
): readonly number[] {
  const cycleSeconds = SECONDS_PER_MINUTE / SIMULATED_HEART_RATE_BPM;
  const projection = LEAD_PROJECTION[lead];
  const sampleCount = Math.round(durationSeconds * samplingRateHz);

  return Array.from({ length: sampleCount }, (_, index) => {
    const second = startSecond + index / samplingRateHz;
    // El resto respecto al ciclo hace que los latidos encadenen sin costura
    // aunque el tramo empiece a mitad de uno.
    return projection * beatAt(second % cycleSeconds);
  });
}
