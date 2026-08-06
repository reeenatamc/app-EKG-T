/**
 * Instrumentacion de los tiempos que fijan los criterios de aceptacion.
 *
 * Vive aparte de las pantallas por dos motivos: no ensucia la interfaz con
 * codigo de medicion, y cuando los criterios esten validados basta con borrar
 * este archivo y sus tres llamadas.
 *
 * Todo queda envuelto en __DEV__, asi que no llega a la compilacion de
 * produccion.
 */

/**
 * Umbrales de los criterios de aceptacion, en milisegundos.
 *
 * El criterio original exigia 500 ms desde el obturador hasta la revision. Al
 * desglosar la captura en un Redmi Note 9 Pro (7 muestras) resulto que el
 * disparo del sensor consume ~857 ms de media y el procesado propio ~61 ms: el
 * 94 % del tiempo es enfoque, exposicion, lectura del sensor e ISP, que la
 * aplicacion no controla. Un limite de 500 ms sobre el total era inalcanzable
 * por hardware, no por codigo.
 *
 * Por eso se separa en dos: uno exigente sobre lo que si controlamos y otro
 * realista sobre la experiencia completa.
 */
const THRESHOLD_MS = {
  previewReady: 1500,
  /** Recorte, codificacion y escritura. Lo unico que depende de nuestro codigo. */
  captureProcessing: 200,
  /** Captura completa, disparo del sensor incluido. */
  captureTotal: 1200,
} as const;

function report(label: string, elapsedMs: number, thresholdMs: number): void {
  const verdict = elapsedMs <= thresholdMs ? 'OK' : 'EXCEDE';
  console.warn(
    `[timing] ${label}: ${Math.round(elapsedMs)} ms (limite ${thresholdMs} ms) ${verdict}`,
  );
}

/**
 * Registra cuanto tardo la vista previa en quedar operativa.
 *
 * @param startedAt Marca de tiempo del montaje de la pantalla de captura.
 */
export function reportPreviewReady(startedAt: number): void {
  if (!__DEV__) {
    return;
  }
  report('vista previa operativa', Date.now() - startedAt, THRESHOLD_MS.previewReady);
}

/**
 * Registra cuanto tardo la captura en llegar a la pantalla de revision.
 *
 * @param startedAt Marca de tiempo de la pulsacion del obturador.
 */
export function reportCaptureCompleted(startedAt: number): void {
  if (!__DEV__) {
    return;
  }
  report('captura completa', Date.now() - startedAt, THRESHOLD_MS.captureTotal);
}

/**
 * Desglosa el tiempo de captura en sus dos fases.
 *
 * El tiempo del sensor se informa sin veredicto porque no hay decision de
 * diseno que pueda mejorarlo: depende del enfoque y del ISP del dispositivo.
 * El procesado si se juzga, porque es codigo nuestro.
 *
 * @param sensorMs Tiempo del disparo: enfoque, exposicion, sensor e ISP.
 * @param processingMs Tiempo de recorte, codificacion y escritura.
 */
export function reportCapturePhases(sensorMs: number, processingMs: number): void {
  if (!__DEV__) {
    return;
  }
  console.warn(`[timing] sensor (no controlado por la app): ${Math.round(sensorMs)} ms`);
  report('procesado propio', processingMs, THRESHOLD_MS.captureProcessing);
}
