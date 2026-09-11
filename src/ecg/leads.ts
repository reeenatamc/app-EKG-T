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
import { segmentEnd, type EcgSignal, type LeadName } from '@/ecg/signal';

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
 * Tiras de ritmo en el orden en que las imprime un electrocardiografo con tres.
 * Cualquier otra que llegue va detras, en el orden de la senal.
 */
const PREFERRED_STRIPS: readonly LeadName[] = [RHYTHM_LEAD, 'V1', 'V5'];

/**
 * Cuantas columnas tiene que cubrir lo registrado para contar como tira.
 *
 * Una derivacion de rejilla ocupa exactamente su columna y una tira las ocupa
 * todas. Columna y media deja margen a los bordes que el digitalizador recorta o
 * alarga unos milisegundos, y sigue muy lejos de lo que mide una tira.
 */
const STRIP_MIN_COLUMNS = 1.5;

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
 * Cuanto dura el registro que se va a dibujar.
 *
 * Se lee de la senal y no se supone. El servidor corrige la velocidad del papel
 * antes de enviar el trazado, asi que un registro impreso a 50 mm/s llega con 5 s:
 * la misma hoja a doble velocidad abarca la mitad de tiempo. Suponer los diez
 * segundos estandar buscaba cada columna en una ventana donde no habia dato, y
 * nueve de las doce celdas salian vacias.
 *
 * @param signal Senal digitalizada.
 * @returns Su duracion, o la estandar si la senal no trae una utilizable.
 */
export function recordSecondsOf(signal: EcgSignal): number {
  return signal.durationSeconds > 0 ? signal.durationSeconds : RECORD_SECONDS;
}

/**
 * Derivaciones que la senal trae registradas a lo largo de todo el papel.
 *
 * Son las que se imprimieron como tira de ritmo, y se leen de la senal y no del
 * montaje. En los registros reales el digitalizador identifica a menudo un 3x4
 * con tres tiras (II, V1 y V5) que se encuadro como 3x4 simple, porque el menu de
 * montajes no pregunta cuantas tiras hay. Decidirlo por el montaje dejaba sin
 * dibujar diez segundos de ritmo que el servidor si habia enviado, y dibujaba una
 * fila vacia cuando el montaje anunciaba una tira que la hoja no tenia.
 *
 * Se mide de principio a fin de lo registrado y no por muestras: una tira puede
 * traer huecos donde el digitalizador perdio el trazo y sigue siendo una tira.
 *
 * @param signal Senal digitalizada.
 * @param mount Montaje del registro, que fija cuanto dura una columna.
 * @returns Las tiras, con II, V1 y V5 delante.
 */
export function rhythmStripLeads(signal: EcgSignal, mount: MountId): readonly LeadName[] {
  const columnSeconds = recordSecondsOf(signal) / columnCount(mount);

  const strips = signal.leads
    .filter((lead) => {
      const first = lead.segments[0];
      const last = lead.segments[lead.segments.length - 1];
      if (first === undefined || last === undefined) {
        return false;
      }
      const span = segmentEnd(last, signal.samplingRateHz) - first.startSecond;
      return span > STRIP_MIN_COLUMNS * columnSeconds;
    })
    .map((lead) => lead.name);

  return [
    ...PREFERRED_STRIPS.filter((name) => strips.includes(name)),
    ...strips.filter((name) => !PREFERRED_STRIPS.includes(name)),
  ];
}

/**
 * Cuantas columnas de tiempo tiene un montaje.
 *
 * @param mount Montaje del registro.
 * @returns El numero de columnas.
 */
export function columnCount(mount: MountId): number {
  return Math.max(...layoutFor(mount).map((placement) => placement.column)) + 1;
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

/**
 * Las derivaciones de una observacion que la senal trae de verdad.
 *
 * Se cruzan las dos listas en lugar de confiar en los nombres que da la
 * observacion: el modelo nombra la derivacion en la que se apoya, pero puede
 * nombrar una que la digitalizacion no recupero. Enfocar sobre una derivacion
 * ausente atenuaria el trazado entero y pareceria que la aplicacion se apago.
 *
 * @param signal Senal digitalizada.
 * @param named Nombres que da la observacion.
 * @returns Las presentes, o null si no queda ninguna.
 */
export function presentLeads(
  signal: EcgSignal,
  named: readonly string[],
): readonly LeadName[] | null {
  const present = signal.leads.map((lead) => lead.name).filter((name) => named.includes(name));

  return present.length === 0 ? null : present;
}
