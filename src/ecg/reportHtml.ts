/**
 * Composicion del informe exportable.
 *
 * Modulo puro: produce una cadena de HTML y no toca ni impresora ni disco. Eso
 * permite probar el escapado y la estructura sin generar un PDF.
 *
 * EL AVISO CLINICO VA EN EL INFORME, no solo en la aplicacion. Un PDF se
 * reenvia, se imprime y acaba en manos de alguien que nunca vio la pantalla
 * donde ponia que esto no diagnostica. Si el aviso no viaja con el documento, a
 * efectos practicos no existe.
 */

import { MOUNT_COPY } from '@/constants/captureText';
import { MEASUREMENT_LABELS, STUDY_TEXT } from '@/constants/studyText';
import type { EcgAnalysis, EcgMeasurements } from '@/ecg/EcgAnalysisService';
import type { QueuedStudy } from '@/capture/study';
import { paperLight } from '@/design/tokens';

/** Alto reservado al trazado dentro del informe, en unidades del SVG. */
export const REPORT_TRACE_HEIGHT = 420;

export interface ReportInput {
  readonly study: QueuedStudy;
  readonly analysis: EcgAnalysis;
  /** Camino SVG del trazado, ya compuesto. */
  readonly tracePath: string;
  /** Ancho del sistema de coordenadas del trazado. */
  readonly traceWidth: number;
  readonly note: string;
}

/**
 * Escapa texto para meterlo en HTML.
 *
 * Hace falta de verdad: la anotacion la escribe el usuario, y un simple signo
 * de menor que en "QT < 400" romperia el documento. No es una cuestion de
 * seguridad —el HTML no sale del dispositivo— sino de que el informe salga
 * entero.
 *
 * @param value Texto a escapar.
 * @returns El texto seguro para HTML.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Compone el informe en HTML.
 *
 * @param input Estudio, analisis, trazado y anotacion.
 * @returns El documento listo para imprimir a PDF.
 */
export function buildReportHtml(input: ReportInput): string {
  const { study, analysis, tracePath, traceWidth, note } = input;
  const capturedAt = new Date(study.metadata.capturedAt).toLocaleString();

  return `<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><style>${REPORT_STYLES}</style></head>
<body>
  <h1>Electrocardiograma ${escapeHtml(study.metadata.anonymousId)}</h1>
  <p class="meta">
    ${escapeHtml(capturedAt)} ·
    ${escapeHtml(MOUNT_COPY[study.metadata.mount].label)} ·
    ${study.metadata.calibration.speedMmPerSecond} mm/s ·
    ${study.metadata.calibration.gainMmPerMillivolt} mm/mV
  </p>

  <p class="notice">${escapeHtml(STUDY_TEXT.supportOnly)}</p>

  <svg viewBox="0 0 ${traceWidth} ${REPORT_TRACE_HEIGHT}" class="trace">
    <path d="${tracePath}" fill="none" stroke="${paperLight.ink}" stroke-width="1.2"
          stroke-linejoin="round" stroke-linecap="round"/>
  </svg>

  ${renderMeasurements(analysis.measurements)}
  ${renderObservations(analysis)}
  ${renderNote(note)}
</body>
</html>`;
}

function renderMeasurements(measurements: EcgMeasurements | null): string {
  if (measurements === null) {
    return '';
  }

  const rows = Object.entries(MEASUREMENT_LABELS)
    .map(
      ([key, copy]) =>
        `<tr><td>${escapeHtml(copy.label)}</td><td class="value">${
          measurements[key as keyof EcgMeasurements]
        } ${escapeHtml(copy.unit)}</td></tr>`,
    )
    .join('');

  return `<h2>Medidas</h2><table>${rows}</table>`;
}

function renderObservations(analysis: EcgAnalysis): string {
  if (analysis.observations.length === 0) {
    return '';
  }

  const items = analysis.observations
    .map(
      (observation) =>
        `<li>${escapeHtml(observation.label)}
         <span class="review">${escapeHtml(STUDY_TEXT.observationNeedsReview)}</span></li>`,
    )
    .join('');

  return `<h2>Observaciones</h2><ul>${items}</ul>`;
}

function renderNote(note: string): string {
  if (note.trim().length === 0) {
    return '';
  }
  return `<h2>Anotaciones</h2><p>${escapeHtml(note)}</p>`;
}

/**
 * Estilo del informe.
 *
 * Deliberadamente sobrio y en tinta oscura sobre blanco: esto se imprime, y la
 * paleta de la aplicacion no sobrevive a una impresora en blanco y negro.
 */
const REPORT_STYLES = `
  body { font-family: -apple-system, Roboto, sans-serif; color: ${paperLight.ink}; padding: 24px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 20px 0 6px; text-transform: uppercase; letter-spacing: 0.5px; }
  .meta { color: ${paperLight.textLow}; font-size: 12px; margin: 0 0 16px; }
  .notice { border-left: 3px solid ${paperLight.ink}; padding-left: 10px; font-size: 12px; }
  .trace { width: 100%; height: auto; border: 1px solid ${paperLight.gridBold}; }
  table { border-collapse: collapse; font-size: 13px; }
  td { padding: 3px 16px 3px 0; }
  .value { font-family: monospace; }
  ul { font-size: 13px; padding-left: 18px; }
  .review { color: ${paperLight.textLow}; font-size: 11px; }
`;
