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
import type { EcgSignal, LeadName } from '@/ecg/signal';

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

/** Fraccion del registro que hay que cubrir para considerarse una tira continua. */
const FULL_LENGTH_COVERAGE = 0.9;

/**
 * La derivacion que sirve de tira de ritmo en una senal ya digitalizada.
 *
 * NO SE ASUME `RHYTHM_LEAD`, Y ESA ES LA CORRECCION. II es la eleccion correcta
 * para la guia de encuadre, donde todavia no se sabe que trae el papel, y estaba
 * bien mientras el visor solo dibujaba senal inventada. Sobre una senal real es
 * un dato conocido: la digitalizacion dice cuales volvieron enteras.
 *
 * Medido en una hoja real: las tiras eran V1, V5 y V6, y el visor pintaba una
 * tira rotulada II con dos segundos y medio de trazo, porque de II solo existia
 * su celda de la rejilla. Una tira que se corta a un cuarto parece señal
 * perdida, no un rotulo equivocado.
 *
 * Se prefiere II cuando esta entera porque es la convencion -- muestra la onda P
 * con claridad -- y si no, la primera que lo este. Si ninguna lo esta no hay tira
 * que pintar, y decirlo es mejor que dibujar un muñon.
 *
 * @param signal Senal digitalizada.
 * @returns La derivacion de la tira, o null si ninguna cubre el registro.
 */
export function rhythmLeadFor(signal: EcgSignal): LeadName | null {
  const covered = (lead: EcgSignal['leads'][number]): number =>
    lead.segments.reduce((total, segment) => total + segment.values.length, 0);

  const full = signal.leads.filter(
    (lead) =>
      covered(lead) >= signal.durationSeconds * signal.samplingRateHz * FULL_LENGTH_COVERAGE,
  );

  if (full.length === 0) {
    return null;
  }

  return full.some((lead) => lead.name === RHYTHM_LEAD) ? RHYTHM_LEAD : (full[0]?.name ?? null);
}
