import { Skia } from '@shopify/react-native-skia';

/**
 * Iconos de navegacion, dibujados a mano.
 *
 * VAN APARTE DE `tabIcons.ts` y no es una separacion de carpetas: son otra
 * familia. Los de la barra cumplen la promesa de D-12 y salen del vocabulario
 * del instrumento —el latido, la hoja, la guia de encuadre—. Estos no
 * pueden: cerrar, volver, la galeria y girar son convenciones del sistema, y un electrocardiograma
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

/**
 * Una imagen: marco, montana y sol. Es como se reconoce la galeria en cualquier
 * sistema, y aqui sustituye a la etiqueta de texto, que con el telefono en
 * horizontal se leia de lado.
 */
const GALLERY_PICTURE = 'M4 5 H20 V19 H4 Z M4 16 L9 11 L13 15 L16 12 L20 16 M15.5 8.5 H15.6';

/** Flecha que gira en sentido horario, para enderezar una imagen un cuarto de vuelta. */
const ROTATE_ARROW = 'M22 4 V10 H16 M19.5 15 A9 9 0 1 1 17.4 5.64 L22 10';

export const NAV_ICON_PATHS = {
  close: Skia.Path.MakeFromSVGString(CLOSE_CROSS),
  back: Skia.Path.MakeFromSVGString(BACK_CHEVRON),
  gallery: Skia.Path.MakeFromSVGString(GALLERY_PICTURE),
  rotate: Skia.Path.MakeFromSVGString(ROTATE_ARROW),
} as const;

export type NavIconName = keyof typeof NAV_ICON_PATHS;
