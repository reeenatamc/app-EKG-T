import { Skia } from '@shopify/react-native-skia';

import { BEAT_POINTS, beatSvg } from '@/design/beatPoints';

export { BEAT_VIEWBOX } from '@/design/beatPoints';

/**
 * El latido de SKILL.md §8, ya construido como path de Skia.
 *
 * La anatomia vive en `beatPoints.ts`, sin Skia, porque tambien la usa el
 * script de iconos en Node. Aqui solo se construye el path.
 *
 * Construido una sola vez, a nivel de modulo. Rehacerlo en cada render seria
 * una asignacion por fotograma, y §13 lo marca como antipatron.
 */
export const BEAT_PATH = Skia.Path.MakeFromSVGString(beatSvg(BEAT_POINTS));
