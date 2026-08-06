import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import type { QueuedStudy } from '@/capture/study';
import type { EcgAnalysis } from '@/ecg/EcgAnalysisService';
import { computeTraceScale } from '@/ecg/grid';
import { RECORD_SECONDS } from '@/ecg/leads';
import { buildSvgPath } from '@/ecg/svgTrace';
import { buildReportHtml, REPORT_TRACE_HEIGHT } from '@/ecg/reportHtml';
import { buildLeadPolylines } from '@/ecg/tracePath';

/**
 * Genera el informe en PDF y ofrece compartirlo.
 *
 * SE EXPORTA LA TIRA DE RITMO, no las doce derivaciones. Un informe de una
 * pagina con doce trazados reducidos no se lee: cada uno quedaria de un
 * centimetro de alto. La derivacion continua de diez segundos es la que se
 * comenta y la que se ensena, y es la unica sin huecos.
 *
 * @param study Estudio al que pertenece el informe.
 * @param analysis Analisis ya listo.
 * @param note Anotacion del usuario, o cadena vacia.
 * @returns La ruta del PDF generado.
 * @throws {Error} Si la impresion a archivo falla.
 */
export async function exportReport(
  study: QueuedStudy,
  analysis: EcgAnalysis,
  note: string,
): Promise<string> {
  const html = buildReportHtml({
    study,
    analysis,
    ...renderTrace(analysis, study),
    note,
  });

  const { uri } = await Print.printToFileAsync({ html });

  // Compartir es opcional: en un dispositivo sin hoja de comparticion el PDF ya
  // esta generado y no tiene sentido fallar por no poder ofrecerlo.
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }

  return uri;
}

/** Ancho del sistema de coordenadas del trazado dentro del informe. */
const REPORT_TRACE_WIDTH = 1200;

/**
 * Compone el camino SVG de la derivacion mas larga del estudio.
 *
 * @param analysis Analisis con la senal.
 * @param study Estudio, del que sale la calibracion.
 * @returns El camino y el ancho de su sistema de coordenadas.
 */
function renderTrace(
  analysis: EcgAnalysis,
  study: QueuedStudy,
): { readonly tracePath: string; readonly traceWidth: number } {
  const signal = analysis.signal;
  if (signal === null || signal.leads.length === 0) {
    return { tracePath: '', traceWidth: REPORT_TRACE_WIDTH };
  }

  // La derivacion con mas muestras registradas: con tira de ritmo sera la
  // continua de diez segundos; sin ella, cualquiera de las de rejilla.
  const longest = signal.leads.reduce((best, lead) =>
    sampleCount(lead.segments) > sampleCount(best.segments) ? lead : best,
  );

  const pixelsPerMm =
    REPORT_TRACE_WIDTH / (RECORD_SECONDS * study.metadata.calibration.speedMmPerSecond);
  const scale = computeTraceScale(study.metadata.calibration, pixelsPerMm);

  const polylines = buildLeadPolylines(
    longest,
    signal.samplingRateHz,
    { fromSecond: 0, toSecond: RECORD_SECONDS, baselineY: REPORT_TRACE_HEIGHT / 2 },
    scale,
  );

  return { tracePath: buildSvgPath(polylines), traceWidth: REPORT_TRACE_WIDTH };
}

function sampleCount(segments: readonly { readonly values: readonly number[] }[]): number {
  return segments.reduce((total, segment) => total + segment.values.length, 0);
}
