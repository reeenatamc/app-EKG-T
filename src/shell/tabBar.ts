/**
 * Geometria de la barra de pestanas y de su burbuja.
 *
 * Vive aparte y sin React porque es aritmetica que se equivoca en silencio: una
 * burbuja desplazada medio hueco no rompe nada, solo marca la pestana de al lado.
 */

/**
 * Lo que ocupa cada hueco de la barra, en orden.
 *
 * Capturar va en medio y NO es una pestana: abre la captura a pantalla completa,
 * no cambia de seccion. Por eso no tiene ruta aqui y la burbuja nunca se posa en
 * ella.
 */
export const TAB_SLOTS = ['/home', '/history', null, '/profile'] as const;

/** Hueco que ocupa la accion de captura. */
export const CAPTURE_SLOT = TAB_SLOTS.indexOf(null);

/**
 * Hueco en el que debe estar la burbuja para una ruta.
 *
 * @param pathname Ruta activa.
 * @returns El hueco, o null si la ruta no es una de las pestanas.
 */
export function slotForPath(pathname: string): number | null {
  const slot = TAB_SLOTS.indexOf(pathname as (typeof TAB_SLOTS)[number]);

  return slot < 0 || TAB_SLOTS[slot] === null ? null : slot;
}

/**
 * Ancho de cada hueco.
 *
 * Los cuatro reparten el ancho por igual, descontando el relleno de los dos
 * lados y los tres espacios entre ellos.
 *
 * @param rowWidth Ancho de la fila, relleno incluido.
 * @param padding Relleno a cada lado.
 * @param spacing Espacio entre huecos.
 * @returns El ancho de un hueco, nunca negativo.
 */
export function slotWidth(rowWidth: number, padding: number, spacing: number): number {
  const count = TAB_SLOTS.length;

  return Math.max(0, (rowWidth - 2 * padding - (count - 1) * spacing) / count);
}

/**
 * Posicion horizontal de un hueco, desde el borde izquierdo de la fila.
 *
 * Acepta huecos fraccionarios a proposito: mientras la burbuja viaja de una
 * pestana a otra el hueco vale, por ejemplo, 0,4, y la posicion tiene que caer
 * entre las dos.
 *
 * @param slot Hueco, posiblemente fraccionario.
 * @param width Ancho de un hueco.
 * @param padding Relleno a cada lado.
 * @param spacing Espacio entre huecos.
 * @returns La coordenada x del borde izquierdo del hueco.
 */
export function slotOffset(slot: number, width: number, padding: number, spacing: number): number {
  'worklet';
  return padding + slot * (width + spacing);
}
