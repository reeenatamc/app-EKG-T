/**
 * Geometria de la vista ampliada de una derivacion.
 *
 * Modulo puro. Ampliar NO cambia la calibracion: es la misma escala en
 * milimetros con mas pixeles por milimetro, asi que contar cuadros en la vista
 * ampliada sigue dando segundos y milivoltios de verdad.
 */

import type { Calibration } from '@/capture/study';
import {
  computeGridGeometry,
  computeTraceScale,
  type GridGeometry,
  type TraceScale,
} from '@/ecg/grid';
import type { TraceViewport } from '@/ecg/tracePath';

/** Pixeles por milimetro de la vista ampliada: un cuadro pequeno mide 8 puntos. */
export const ZOOM_PIXELS_PER_MM = 8;

/** Milivoltios de alto: cuatro, para que un QRS alto no se salga del lienzo. */
export const ZOOM_MILLIVOLT_SPAN = 4;

export interface LeadZoomGeometry {
  readonly width: number;
  readonly height: number;
  readonly scale: TraceScale;
  readonly grid: GridGeometry;
  readonly viewport: TraceViewport;
  readonly fromSecond: number;
  readonly toSecond: number;
  /** Puntos por tramo al decimar. Ver computeLeadZoom. */
  readonly maxPointsPerSegment: number;
}

/**
 * Calcula el lienzo de la vista ampliada para una ventana temporal.
 *
 * @param span Ventana temporal de la derivacion.
 * @param calibration Velocidad y amplitud del registro.
 * @returns Tamano del lienzo, escala y limite de decimado.
 */
export function computeLeadZoom(
  span: { readonly fromSecond: number; readonly toSecond: number },
  calibration: Calibration,
): LeadZoomGeometry {
  const scale = computeTraceScale(calibration, ZOOM_PIXELS_PER_MM);
  const width = (span.toSecond - span.fromSecond) * scale.pixelsPerSecond;

  return {
    width,
    height: ZOOM_MILLIVOLT_SPAN * scale.pixelsPerMillivolt,
    scale,
    grid: computeGridGeometry(scale),
    viewport: {
      fromSecond: span.fromSecond,
      toSecond: span.toSecond,
      baselineY: (ZOOM_MILLIVOLT_SPAN * scale.pixelsPerMillivolt) / 2,
    },
    fromSecond: span.fromSecond,
    toSecond: span.toSecond,
    // Un punto por pixel. Con el limite del visor normal (512 por tramo) una
    // tira de diez segundos a esta escala perderia justo las muescas del QRS
    // que se amplia para ver.
    maxPointsPerSegment: Math.ceil(width),
  };
}

/**
 * Escribe una magnitud de la reticula con coma decimal: 0,04 y no 0.04.
 *
 * @param value Magnitud a escribir.
 * @returns La magnitud con hasta tres decimales.
 */
export function formatScaleNumber(value: number): string {
  return String(Math.round(value * 1000) / 1000).replace('.', ',');
}
