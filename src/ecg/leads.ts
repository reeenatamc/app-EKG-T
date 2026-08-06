/**
 * Reparto de las derivaciones sobre la hoja.
 *
 * Modulo puro. Describe que derivacion ocupa cada celda de cada montaje y que
 * tramo de los diez segundos se imprimio en ella. De aqui salen los huecos: en
 * un 3x4, la derivacion I ocupa la primera columna, o sea de 0 a 2,5 s, y en los
 * otros 7,5 s **no hay dato de I**.
 *
 * El orden de las derivaciones no es arbitrario ni estetico. Las tres primeras
 * son las bipolares de Einthoven, siguen las tres aumentadas de Goldberger y
 * despues las precordiales de V1 a V6. Cambiarlo haria que un clinico leyera la
 * hoja mal, porque busca cada derivacion por su posicion.
 */

import type { MountId } from '@/camera/mounts';
import type { LeadName } from '@/ecg/signal';

/** Duracion estandar de un registro de doce derivaciones. */
export const RECORD_SECONDS = 10;

export interface LeadPlacement {
  readonly name: LeadName;
  readonly row: number;
  readonly column: number;
  /** Segundo del registro en que empieza esta celda. */
  readonly startSecond: number;
  /** Cuanto dura la celda. Fuera de ella, esta derivacion no tiene dato. */
  readonly durationSeconds: number;
}

/** Las doce derivaciones estandar, en el orden de lectura por columnas de un 3x4. */
const STANDARD_COLUMNS: readonly (readonly LeadName[])[] = [
  ['I', 'II', 'III'],
  ['aVR', 'aVL', 'aVF'],
  ['V1', 'V2', 'V3'],
  ['V4', 'V5', 'V6'],
];

/** Precordiales derechas, que sustituyen a las izquierdas en el registro derecho. */
const RIGHT_COLUMNS: readonly (readonly LeadName[])[] = [
  ['I', 'II', 'III'],
  ['aVR', 'aVL', 'aVF'],
  ['V4R', 'V5R', 'V6R'],
];

/** Derivacion de la tira de ritmo. II se elige porque muestra la P con claridad. */
export const RHYTHM_LEAD: LeadName = 'II';

/**
 * Calcula donde cae cada derivacion en un montaje.
 *
 * @param mount Montaje del registro.
 * @returns Las celdas, en orden de fila y columna.
 */
export function layoutFor(mount: MountId): readonly LeadPlacement[] {
  switch (mount) {
    case 'standard-3x4':
    case 'rhythm-3x4':
      return fromColumns(STANDARD_COLUMNS);
    case 'right-3x3':
      return fromColumns(RIGHT_COLUMNS);
    case 'six-2':
      return fromColumns([
        ['I', 'II', 'III', 'aVR', 'aVL', 'aVF'],
        ['V1', 'V2', 'V3', 'V4', 'V5', 'V6'],
      ]);
    case 'twelve-1':
      return fromColumns([STANDARD_COLUMNS.flat()]);
  }
}

/**
 * Cierto si el montaje anade una tira de ritmo continua al pie.
 *
 * @param mount Montaje del registro.
 * @returns Si hay tira de ritmo.
 */
export function hasRhythmStrip(mount: MountId): boolean {
  return mount === 'rhythm-3x4';
}

/**
 * Reparte los diez segundos entre las columnas dadas.
 *
 * Cada columna recibe una fraccion igual del registro, que es como imprime un
 * electrocardiografo: el trazado avanza y va cambiando de derivacion.
 *
 * @param columns Derivaciones de cada columna, de arriba abajo.
 * @returns Las celdas con su ventana temporal.
 */
function fromColumns(columns: readonly (readonly LeadName[])[]): readonly LeadPlacement[] {
  const durationSeconds = RECORD_SECONDS / columns.length;

  return columns.flatMap((column, columnIndex) =>
    column.map((name, rowIndex) => ({
      name,
      row: rowIndex,
      column: columnIndex,
      startSecond: columnIndex * durationSeconds,
      durationSeconds,
    })),
  );
}
