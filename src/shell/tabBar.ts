import { TAB_TEXT } from '@/constants/shellText';
import { gap, size } from '@/design/tokens';

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
export const TAB_ITEMS = [
  { route: '/home', label: TAB_TEXT.home, icon: 'home' },
  { route: '/history', label: TAB_TEXT.history, icon: 'history' },
  { route: null, label: TAB_TEXT.capture, icon: 'capture' },
  { route: '/profile', label: TAB_TEXT.profile, icon: 'profile' },
] as const;

const TAB_SLOTS = TAB_ITEMS.map((item) => item.route);

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
 * @param expanded Cierto si la seccion activa ocupa dos unidades para llevar su etiqueta.
 * @returns El ancho de un hueco, nunca negativo.
 */
export function slotWidth(
  rowWidth: number,
  padding: number,
  spacing: number,
  expanded = false,
): number {
  const count = TAB_SLOTS.length;

  return Math.max(
    0,
    (rowWidth - 2 * padding - (count - 1) * spacing) / (count + (expanded ? 1 : 0)),
  );
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

/**
 * Ancho de un hueco concreto: dos unidades si lleva la etiqueta al lado, una si no.
 *
 * @param unit Ancho de una unidad, el que devuelve `slotWidth`.
 * @param wide Cierto para la seccion activa con la barra expandida.
 * @returns El ancho del hueco.
 */
export function tabSpan(unit: number, wide: boolean): number {
  return unit * (wide ? 2 : 1);
}

/** Reserva para icono y dos líneas de etiqueta con el tamaño de texto del sistema. */
export function tabBarClearance(fontScale: number): number {
  const labelHeight = size.tabLabelLineHeight * Math.max(fontScale, 1) * 2;
  const contentHeight = Math.max(size.tabHeight, size.tabIcon + labelHeight + gap.sm * 2 + gap.xs);
  return contentHeight + gap.xs * 2 + size.hairline * 2 + gap.sm + gap.lg;
}
