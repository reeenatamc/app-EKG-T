/**
 * Donde se queda la hoja inferior al soltarla.
 *
 * PURO Y FUERA DEL GESTO. El arrastre corre en el hilo de interfaz, pero la
 * decision de abrir o cerrar se toma una vez, al soltar, y ahi un fotograma de
 * retraso no se nota. A cambio la regla se prueba sin montar nada.
 */

/**
 * Velocidad a partir de la cual un lanzamiento decide por si solo, en puntos por
 * segundo. Por debajo manda la posicion: quien arrastra despacio y suelta a medio
 * camino quiere que la hoja vaya al lado donde la dejo.
 */
export const SHEET_FLING_VELOCITY = 800;

/** Recorrido minimo antes de que el arrastre gane al toque de una pestana. */
export const SHEET_DRAG_SLOP = 8;

/**
 * Alto de la hoja abierta, como fraccion del alto de la ventana.
 *
 * Deja a la vista la cabecera del estudio: la hoja abierta tapa el trazado, pero
 * no la salida ni lo que se esta mirando.
 */
export const SHEET_HEIGHT_RATIO = 0.8;

/**
 * Cuanto baja la hoja cerrada: todo menos la barrita y las pestanas.
 *
 * @param sheetHeight Alto de la hoja abierta.
 * @param headerHeight Alto de la barrita y las pestanas.
 * @param bottomInset Zona del sistema al pie de la pantalla.
 * @returns El desplazamiento de la hoja cerrada, nunca negativo.
 */
export function sheetClosedOffset(
  sheetHeight: number,
  headerHeight: number,
  bottomInset: number,
): number {
  return Math.max(0, sheetHeight - headerHeight - bottomInset);
}

/**
 * Si la hoja termina abierta al soltarla.
 *
 * @param offset Desplazamiento al soltar: 0 abierta, `closedOffset` cerrada.
 * @param velocityY Velocidad vertical al soltar; negativa hacia arriba.
 * @param closedOffset Desplazamiento de la hoja cerrada.
 * @returns Cierto si debe quedar abierta.
 */
export function shouldOpenSheet(offset: number, velocityY: number, closedOffset: number): boolean {
  if (velocityY <= -SHEET_FLING_VELOCITY) {
    return true;
  }

  if (velocityY >= SHEET_FLING_VELOCITY) {
    return false;
  }

  return offset < closedOffset / 2;
}
