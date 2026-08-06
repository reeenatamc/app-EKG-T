/**
 * Geometria del trazado en pantalla.
 *
 * Modulo puro, y separado del dibujo con Skia a proposito: la garantia clinica
 * de esta etapa —que el trazado se corta en los huecos y jamas los cruza— se
 * puede comprobar aqui, con una prueba, en lugar de mirando una pantalla.
 *
 * COMO SE GARANTIZA EL CORTE. Cada tramo continuo produce **una polilinea
 * propia**. No hay ninguna operacion que concatene las polilineas de una misma
 * derivacion: no es que se evite unirlas, es que no existe la funcion que lo
 * haria. Al dibujar, cada polilinea se anade al camino de Skia con su propio
 * addPoly, que abre un contorno nuevo, asi que Skia tampoco puede unirlas.
 */

import { decimateSegment, type Point } from '@/ecg/decimate';
import type { TraceScale } from '@/ecg/grid';
import { segmentsInWindow, type Lead } from '@/ecg/signal';

/** Un tramo continuo, ya en pixeles y listo para dibujar. */
export interface Polyline {
  readonly points: readonly Point[];
}

export interface TraceViewport {
  /** Principio de la ventana visible, en segundos del registro. */
  readonly fromSecond: number;
  /** Final de la ventana visible, en segundos del registro. */
  readonly toSecond: number;
  /** Altura, en pixeles, de la linea de base de esta derivacion. */
  readonly baselineY: number;
}

/**
 * Puntos por tramo que se conservan al decimar.
 *
 * Del orden del ancho en pixeles de una fila: mas puntos que pixeles no anaden
 * detalle visible y si coste. Ver la cabecera de decimate.ts sobre por que la
 * reduccion es por minimo y maximo.
 */
export const MAX_POINTS_PER_SEGMENT = 512;

/**
 * Convierte una derivacion en las polilineas que hay que dibujar.
 *
 * Devuelve una por tramo registrado. Dos tramos separados por un hueco dan dos
 * polilineas, y entre ellas no hay ningun punto: el hueco no se dibuja porque no
 * se sabe que paso ahi.
 *
 * @param lead Derivacion a dibujar.
 * @param samplingRateHz Frecuencia de muestreo del registro.
 * @param viewport Ventana visible y linea de base.
 * @param scale Escala calibrada de los dos ejes.
 * @returns Una polilinea por tramo visible, con los puntos en pixeles.
 */
export function buildLeadPolylines(
  lead: Lead,
  samplingRateHz: number,
  viewport: TraceViewport,
  scale: TraceScale,
): readonly Polyline[] {
  const visible = segmentsInWindow(lead, viewport.fromSecond, viewport.toSecond, samplingRateHz);

  return (
    visible
      .map((segment) => ({
        points: decimateSegment(
          segment.values,
          segment.startSecond,
          samplingRateHz,
          MAX_POINTS_PER_SEGMENT,
        ).map((point) => toScreen(point, viewport, scale)),
      }))
      // Una polilinea de un solo punto no dibuja nada y complica el recorrido.
      .filter((polyline) => polyline.points.length > 1)
  );
}

/**
 * Lleva un punto de segundos y milivoltios a pixeles de pantalla.
 *
 * El eje vertical se invierte: en la senal, mas milivoltios es mas arriba; en
 * pantalla, mas pixeles es mas abajo. Olvidar esa inversion pinta el
 * electrocardiograma boca abajo, que en un trazado con onda T asimetrica no
 * siempre salta a la vista.
 *
 * @param point Punto en segundos y milivoltios.
 * @param viewport Ventana visible y linea de base.
 * @param scale Escala calibrada.
 * @returns El punto en pixeles.
 */
function toScreen(point: Point, viewport: TraceViewport, scale: TraceScale): Point {
  return {
    x: (point.x - viewport.fromSecond) * scale.pixelsPerSecond,
    y: viewport.baselineY - point.y * scale.pixelsPerMillivolt,
  };
}
