import { Skia, type SkPath } from '@shopify/react-native-skia';

import type { Polyline } from '@/ecg/tracePath';

/**
 * Traduce las polilineas a un camino de Skia.
 *
 * Es la unica parte del trazado que toca Skia, y es deliberadamente mecanica:
 * la decision clinica —donde se corta— ya se tomo en tracePath.ts, que es puro
 * y esta probado.
 *
 * CADA POLILINEA VA CON SU PROPIO addPoly, y ahi esta la garantia. addPoly abre
 * un contorno nuevo en el camino, asi que Skia no une el final de una polilinea
 * con el principio de la siguiente ni aunque queden pegadas en pantalla. El
 * hueco entre dos tramos no se dibuja porque no existe ningun trazo que lo
 * cruce, no porque alguien se acuerde de no dibujarlo.
 *
 * @param polylines Tramos ya en pixeles.
 * @returns El camino a pintar, con un contorno por tramo.
 */
export function buildTracePath(polylines: readonly Polyline[]): SkPath {
  const builder = Skia.PathBuilder.Make();

  for (const polyline of polylines) {
    builder.addPoly([...polyline.points], false);
  }

  return builder.detach();
}
