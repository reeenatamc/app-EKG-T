/**
 * Montajes de electrocardiograma en papel.
 *
 * El montaje es el dato que mas condiciona la digitalizacion: indica cuantas
 * derivaciones hay, como estan repartidas en la hoja y cuales son. Un 3x3 de
 * derivaciones derechas leido como un 3x4 estandar no produce un error visible,
 * produce doce derivaciones mal etiquetadas, que es peor. Por eso se elige antes
 * de confirmar y no se entierra en ajustes.
 *
 * Modulo puro: describe papel, no interfaz.
 */

import type { Size } from '@/camera/framing';

export type MountId = 'standard-3x4' | 'rhythm-3x4' | 'right-3x3' | 'six-2' | 'twelve-1';

export interface Mount {
  readonly id: MountId;
  /** Cuantas derivaciones contiene el montaje. */
  readonly leads: number;
  /** Columnas y filas de la rejilla de trazados. */
  readonly columns: number;
  readonly rows: number;
  /** Tiras de ritmo continuas al pie, ademas de la rejilla. */
  readonly rhythmStrips: number;
  /**
   * Proporcion aproximada de la region impresa, para el marco de encuadre.
   *
   * Sale del reparto nominal a 25 mm/s con filas de unos 20 mm. Es una
   * aproximacion deliberada: el usuario ajusta las cuatro esquinas en la
   * revision, asi que el marco solo tiene que acercarse lo bastante para que
   * encuadrar sea comodo. Conviene contrastarla con impresiones reales del
   * equipo donde se vaya a usar la aplicacion.
   */
  readonly aspect: Size;
}

/**
 * Ancho nominal de la region de trazado, en milimetros.
 *
 * No es una suposicion sobre el tamano de la hoja: sale del propio registro.
 * Un electrocardiograma estandar recoge diez segundos y se imprime a 25 mm/s,
 * asi que el trazado ocupa 250 mm de ancho independientemente de como se
 * reparta en columnas. Un 3x4 son cuatro columnas de 2,5 s, un 6x2 son dos de
 * 5 s y un 12x1 es una de 10 s: los tres suman lo mismo.
 *
 * De aqui salen los pixeles por milimetro que mide el control de calidad.
 */
export const NOMINAL_TRACE_WIDTH_MM = 250;

/**
 * Los cinco montajes admitidos, en el orden en que se ofrecen.
 *
 * El primero es el que trae la aplicacion por defecto porque es, con mucha
 * diferencia, el mas frecuente.
 */
const STANDARD_MOUNT: Mount = {
  id: 'standard-3x4',
  leads: 12,
  columns: 4,
  rows: 3,
  rhythmStrips: 0,
  aspect: { width: 3, height: 2 },
};

export const MOUNTS: readonly Mount[] = [
  STANDARD_MOUNT,
  {
    id: 'rhythm-3x4',
    leads: 12,
    columns: 4,
    rows: 3,
    // Una tira continua al pie, casi siempre II, para valorar el ritmo sobre
    // diez segundos seguidos en lugar de sobre los 2,5 s de la rejilla.
    rhythmStrips: 1,
    aspect: { width: 4, height: 3 },
  },
  {
    id: 'right-3x3',
    // Derivaciones derechas: el registro que se pide ante sospecha de infarto
    // de ventriculo derecho. V4R a V6R sustituyen a las precordiales izquierdas.
    leads: 9,
    columns: 3,
    rows: 3,
    rhythmStrips: 0,
    aspect: { width: 3, height: 2 },
  },
  {
    id: 'six-2',
    leads: 12,
    columns: 2,
    rows: 6,
    rhythmStrips: 0,
    aspect: { width: 2, height: 1 },
  },
  {
    id: 'twelve-1',
    leads: 12,
    columns: 1,
    rows: 12,
    rhythmStrips: 0,
    // Doce bandas apiladas sobre una sola columna de diez segundos: la region
    // impresa queda mas alta que ancha, al reves que el resto.
    aspect: { width: 4, height: 5 },
  },
] as const;

/** Montaje que trae la aplicacion por defecto: el mas frecuente en la practica. */
export const DEFAULT_MOUNT_ID: MountId = 'standard-3x4';

/**
 * Busca un montaje por identificador.
 *
 * @param id Identificador del montaje.
 * @returns El montaje pedido, o el de por defecto si el identificador no existe.
 */
export function findMount(id: MountId): Mount {
  return MOUNTS.find((mount) => mount.id === id) ?? STANDARD_MOUNT;
}
