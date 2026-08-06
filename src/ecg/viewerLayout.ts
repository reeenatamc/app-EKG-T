/**
 * Reparto del visor de doce derivaciones en pantalla.
 *
 * Modulo puro. Traduce el montaje de la hoja a celdas de pixeles, y lo hace
 * **derivando los pixeles por milimetro del ancho disponible** en lugar de
 * suponerlos.
 *
 * Por que asi. Diez segundos a 25 mm/s son 250 mm de papel; a una escala comoda
 * de lectura serian unos mil pixeles, y una pantalla de telefono tiene
 * cuatrocientos. Algo tiene que ceder. Lo que NO cede es la calibracion: los
 * pixeles por milimetro se calculan para que cada columna ocupe exactamente su
 * ventana temporal, y de ese mismo numero salen despues la retícula y la escala
 * del trazado. El resultado es una hoja reducida, que es lo que se hace tambien
 * al imprimir un registro en A4: se lee contando cuadros grandes.
 */

import type { MountId } from '@/camera/mounts';
import type { Calibration } from '@/capture/study';
import { computeTraceScale, type TraceScale } from '@/ecg/grid';
import { hasRhythmStrip, layoutFor, RECORD_SECONDS, RHYTHM_LEAD } from '@/ecg/leads';
import type { LeadName } from '@/ecg/signal';

/**
 * Milivoltios que se reservan de alto por fila.
 *
 * Tres milivoltios, o sea de -1,5 a +1,5. Un complejo QRS normal no pasa de
 * unos 2 mV en las precordiales, asi que este margen deja sitio a una
 * hipertrofia sin que el trazado invada la fila de arriba.
 */
export const ROW_MILLIVOLT_SPAN = 3;

export interface ViewerCell {
  readonly lead: LeadName;
  /** Esquina superior izquierda de la celda, en pixeles del lienzo. */
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  /** Linea de cero milivoltios, en pixeles del lienzo. */
  readonly baselineY: number;
  /** Ventana temporal que muestra esta celda. */
  readonly fromSecond: number;
  readonly toSecond: number;
}

export interface ViewerLayout {
  readonly cells: readonly ViewerCell[];
  readonly width: number;
  readonly height: number;
  /** Escala calibrada, compartida por retícula y trazado. */
  readonly scale: TraceScale;
}

/**
 * Calcula las celdas del visor para un montaje y un ancho dados.
 *
 * @param mount Montaje del registro.
 * @param availableWidth Ancho disponible en pixeles.
 * @param calibration Velocidad y amplitud del registro.
 * @returns Las celdas, el tamano del lienzo y la escala calibrada.
 */
export function computeViewerLayout(
  mount: MountId,
  availableWidth: number,
  calibration: Calibration,
): ViewerLayout {
  const placements = layoutFor(mount);
  const columns = Math.max(...placements.map((placement) => placement.column)) + 1;
  const rows = Math.max(...placements.map((placement) => placement.row)) + 1;

  const secondsPerColumn = RECORD_SECONDS / columns;
  const columnWidth = availableWidth / columns;

  // De aqui sale todo lo demas. La columna tiene que caber exactamente en su
  // ventana temporal, y eso fija cuanto mide un milimetro en esta pantalla.
  const pixelsPerMm = columnWidth / (secondsPerColumn * calibration.speedMmPerSecond);
  const scale = computeTraceScale(calibration, pixelsPerMm);

  const rowHeight = ROW_MILLIVOLT_SPAN * scale.pixelsPerMillivolt;
  const cells = placements.map((placement) =>
    toCell(placement, columnWidth, rowHeight, secondsPerColumn),
  );

  const gridHeight = rows * rowHeight;
  const stripCells = hasRhythmStrip(mount)
    ? [rhythmCell(availableWidth, rowHeight, gridHeight)]
    : [];

  return {
    cells: [...cells, ...stripCells],
    width: availableWidth,
    height: gridHeight + stripCells.length * rowHeight,
    scale,
  };
}

function toCell(
  placement: { readonly name: LeadName; readonly row: number; readonly column: number },
  columnWidth: number,
  rowHeight: number,
  secondsPerColumn: number,
): ViewerCell {
  const y = placement.row * rowHeight;
  const fromSecond = placement.column * secondsPerColumn;

  return {
    lead: placement.name,
    x: placement.column * columnWidth,
    y,
    width: columnWidth,
    height: rowHeight,
    // La linea de base va al centro de la fila: la senal se desvia hacia arriba
    // y hacia abajo por igual.
    baselineY: y + rowHeight / 2,
    fromSecond,
    toSecond: fromSecond + secondsPerColumn,
  };
}

/**
 * La tira de ritmo: una fila propia, a todo lo ancho y con los diez segundos.
 *
 * Existe para poder valorar el ritmo sobre un tramo continuo en lugar de sobre
 * los 2,5 s sueltos de la rejilla, que es justo para lo que se imprime.
 */
function rhythmCell(width: number, rowHeight: number, top: number): ViewerCell {
  return {
    lead: RHYTHM_LEAD,
    x: 0,
    y: top,
    width,
    height: rowHeight,
    baselineY: top + rowHeight / 2,
    fromSecond: 0,
    toSecond: RECORD_SECONDS,
  };
}
