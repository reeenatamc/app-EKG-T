import { Skia } from '@shopify/react-native-skia';

/**
 * El latido de SKILL.md §8.
 *
 * Linea de base, onda P, complejo QRS y onda T. La honestidad anatomica es la
 * diferencia entre disenar *sobre* el tema y disenar *desde* el tema, asi que
 * la forma no se retoca por motivos esteticos.
 *
 * Vive en su propio modulo porque lo usan dos cosas distintas: el trazado
 * difuso del fondo y el latido que se dibuja en el splash. Un unico latido, una
 * unica anatomia.
 */
const BEAT_SVG =
  'M0,200 L180,200 L200,190 L220,210 L240,200 L300,200 ' +
  'L310,120 L325,300 L340,120 L360,200 L440,200 ' +
  'L470,160 L510,200 L1200,200';

/**
 * Construido una sola vez, a nivel de modulo. Rehacerlo en cada render seria
 * una asignacion por fotograma, y §13 lo marca como antipatron.
 */
export const BEAT_PATH = Skia.Path.MakeFromSVGString(BEAT_SVG);

/** Sistema de coordenadas en que se dibujo el latido. */
export const BEAT_VIEWBOX = { width: 1200, height: 400 } as const;
