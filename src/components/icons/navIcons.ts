import { Skia } from '@shopify/react-native-skia';

/**
 * Iconos de navegacion, dibujados a mano.
 *
 * VAN APARTE DE `tabIcons.ts` y no es una separacion de carpetas: son otra
 * familia. Los de la barra cumplen la promesa de D-12 y salen del vocabulario
 * del instrumento —el latido, la hoja, la guia de encuadre—. Estos dos no
 * pueden: cerrar y volver son convenciones del sistema, y un electrocardiograma
 * no tiene ningun objeto que signifique «sal de aqui». Inventarle uno seria
 * pedir que se aprenda un simbolo nuevo justo en el momento en que alguien
 * quiere irse, que es el peor momento posible para aprender nada.
 *
 * Comparten rejilla y grosor con los de la barra, asi que se ven de la misma
 * mano aunque digan cosas distintas.
 *
 * Los caminos se construyen una sola vez a nivel de modulo, como pide §13.
 */

/** Sistema de coordenadas en que estan dibujados. El mismo que los de la barra. */
export const NAV_ICON_VIEWBOX = 24;

/** Aspa de cerrar: dos trazos rectos, el simbolo mas reconocible que existe. */
const CLOSE_CROSS = 'M6 6 L18 18 M18 6 L6 18';

/** Cheuron de volver, apuntando al borde de la pantalla por el que se sale. */
const BACK_CHEVRON = 'M15 4 L7 12 L15 20';

export const NAV_ICON_PATHS = {
  close: Skia.Path.MakeFromSVGString(CLOSE_CROSS),
  back: Skia.Path.MakeFromSVGString(BACK_CHEVRON),
} as const;

export type NavIconName = keyof typeof NAV_ICON_PATHS;
