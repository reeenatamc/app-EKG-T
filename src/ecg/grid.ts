/**
 * Retícula de medicion calibrada, segun SKILL.md §9.
 *
 * Modulo puro. NO ES LA RETICULA AMBIENTAL del fondo: aquella es textura, sus
 * pasos no corresponden a milimetros reales y su desfase inicial es
 * deliberadamente irregular para que nadie pueda medir sobre ella. Esta si se
 * puede medir, y por eso vive aparte y no comparte ni componente ni tokens.
 *
 * LA CALIBRACION ES LA UNIDAD DE LOS DOS EJES. Un electrocardiograma en papel no
 * lleva escala escrita: se lee contando cuadros, y cuantos milimetros vale un
 * cuadro depende de la velocidad y la amplitud con que se imprimio. A la
 * velocidad estandar de 25 mm/s, un milimetro son 0,04 s; a la amplitud estandar
 * de 10 mm/mV, un milimetro son 0,1 mV. Si la retícula que se dibuja y la escala
 * a la que se dibuja el trazado no salen del mismo sitio, quien mida contando
 * cuadros obtendra un intervalo equivocado, y el trazado seguira pareciendo
 * correcto.
 */

import type { Calibration } from '@/capture/study';

/** Lado del cuadro pequeno, en milimetros. Es la unidad de lectura. */
export const SMALL_SQUARE_MM = 1;

/** Lado del cuadro grande, en milimetros. Cinco pequenos, como en el papel. */
export const BOLD_SQUARE_MM = 5;

/**
 * Cuantos segundos vale un milimetro a una velocidad dada.
 *
 * @param speedMmPerSecond Velocidad del papel.
 * @returns Segundos por milimetro. A 25 mm/s, 0,04.
 */
export function secondsPerMillimetre(speedMmPerSecond: number): number {
  return 1 / speedMmPerSecond;
}

/**
 * Cuantos milivoltios vale un milimetro a una amplitud dada.
 *
 * @param gainMmPerMillivolt Amplitud.
 * @returns Milivoltios por milimetro. A 10 mm/mV, 0,1.
 */
export function millivoltsPerMillimetre(gainMmPerMillivolt: number): number {
  return 1 / gainMmPerMillivolt;
}

/**
 * Escala con la que se dibujan retícula y trazado.
 *
 * Las tres magnitudes salen del mismo `pixelsPerMm`, y esa es toda la gracia:
 * mientras vengan de aqui, contar cuadros en pantalla da el mismo resultado que
 * contarlos en el papel.
 */
export interface TraceScale {
  readonly pixelsPerMm: number;
  readonly pixelsPerSecond: number;
  readonly pixelsPerMillivolt: number;
}

/**
 * Deriva la escala de dibujo de la calibracion del registro.
 *
 * @param calibration Velocidad y amplitud con que se imprimio.
 * @param pixelsPerMm Cuantos pixeles ocupa un milimetro en pantalla.
 * @returns La escala de los dos ejes.
 */
export function computeTraceScale(calibration: Calibration, pixelsPerMm: number): TraceScale {
  return {
    pixelsPerMm,
    pixelsPerSecond: calibration.speedMmPerSecond * pixelsPerMm,
    pixelsPerMillivolt: calibration.gainMmPerMillivolt * pixelsPerMm,
  };
}

/** Separacion entre lineas de la retícula, en pixeles. */
export interface GridGeometry {
  readonly smallStepPx: number;
  readonly boldStepPx: number;
}

/**
 * Deriva la separacion de la retícula de la misma escala que el trazado.
 *
 * @param scale Escala de dibujo.
 * @returns Los dos pasos de la retícula.
 */
export function computeGridGeometry(scale: TraceScale): GridGeometry {
  return {
    smallStepPx: SMALL_SQUARE_MM * scale.pixelsPerMm,
    boldStepPx: BOLD_SQUARE_MM * scale.pixelsPerMm,
  };
}

/**
 * Cuanto tiempo abarca un ancho en pixeles.
 *
 * Es la conversion que necesita el visor para saber que ventana temporal cabe
 * en pantalla sin dejar de estar calibrado.
 *
 * @param widthPx Ancho disponible.
 * @param scale Escala de dibujo.
 * @returns La duracion visible, en segundos.
 */
export function visibleSeconds(widthPx: number, scale: TraceScale): number {
  return widthPx / scale.pixelsPerSecond;
}
