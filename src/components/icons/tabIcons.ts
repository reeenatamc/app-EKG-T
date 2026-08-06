import { Skia } from '@shopify/react-native-skia';

/**
 * Iconos de la barra de pestanas, dibujados a mano.
 *
 * Cumplen la promesa de D-12: son lineales y salen del **vocabulario del
 * instrumento**, no de un paquete generico. Ahora hay de donde sacarlos, que era
 * la condicion para dibujarlos: existen el trazado, la hoja de papel y la guia
 * de encuadre.
 *
 * - **Inicio** es el latido: linea de base, onda P, complejo QRS y onda T. Es la
 *   misma anatomia de §8, simplificada para caber en veinticuatro puntos.
 * - **Historial** es una hoja de papel con un trazado dentro. No una carpeta ni
 *   un reloj: lo que se acumula aqui son hojas.
 * - **Capturar** son las cuatro escuadras de la guia de encuadre, literalmente
 *   el mismo dibujo que se ve sobre la camara. El icono ensena el gesto.
 * - **Perfil** es una silueta corriente, y esa es la excepcion deliberada. No
 *   hay ningun objeto del instrumento que signifique "tu cuenta"; un electrodo
 *   seria vocabulario correcto y comunicacion equivocada. Cuando la coherencia
 *   y la claridad chocan, manda la claridad.
 *
 * Los caminos se construyen una sola vez a nivel de modulo, como pide §13: uno
 * por render serian cuatro asignaciones por fotograma de una barra que esta
 * montada en todas las pantallas.
 */

/** Sistema de coordenadas en que estan dibujados los cuatro. */
export const TAB_ICON_VIEWBOX = 24;

const HOME_BEAT = 'M2 13 H6 Q7.5 8.5 9 13 H10.5 L12 4 L13.5 20 L15 13 H16.5 Q18 10 19.5 13 H22';

const HISTORY_SHEET = 'M4 4 H20 V20 H4 Z M7 13 H9.5 L11 9 L12.5 17 L14 13 H17';

const CAPTURE_FRAME = 'M3 9 V4 H8 M16 4 H21 V9 M21 15 V20 H16 M8 20 H3 V15';

const PROFILE_FIGURE = 'M12 11 m-4 0 a4 4 0 1 0 8 0 a4 4 0 1 0 -8 0 M4.5 21 Q12 14 19.5 21';

export const TAB_ICON_PATHS = {
  home: Skia.Path.MakeFromSVGString(HOME_BEAT),
  history: Skia.Path.MakeFromSVGString(HISTORY_SHEET),
  capture: Skia.Path.MakeFromSVGString(CAPTURE_FRAME),
  profile: Skia.Path.MakeFromSVGString(PROFILE_FIGURE),
} as const;

export type TabIconName = keyof typeof TAB_ICON_PATHS;
