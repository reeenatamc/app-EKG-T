/**
 * Trazado en SVG, para el informe exportado.
 *
 * Modulo puro. Existe porque un informe sin trazado no es un informe de un
 * electrocardiograma: las medidas se leen mejor sobre la senal que las produjo.
 *
 * EN VECTOR Y NO EN IMAGEN, por dos motivos. Uno, que una captura de pantalla
 * llevaria la resolucion de la pantalla y no la del dato. Dos, que la imagen
 * original ya no esta: se borra en cuanto el servidor confirma que la recibio.
 *
 * EL CORTE EN LOS HUECOS SE MANTIENE. Cada polilinea abre su propio comando M,
 * que en SVG levanta el lapiz. Igual que addPoly en Skia, y por el mismo motivo:
 * que unir dos tramos exija hacerlo a proposito.
 */

import type { Polyline } from '@/ecg/tracePath';

/** Decimales que se conservan. Mas alla no se distingue y engorda el archivo. */
const PRECISION = 2;

/**
 * Convierte las polilineas en un atributo `d` de SVG.
 *
 * @param polylines Tramos ya en pixeles.
 * @returns El camino, o cadena vacia si no hay nada que dibujar.
 */
export function buildSvgPath(polylines: readonly Polyline[]): string {
  return polylines
    .map((polyline) =>
      polyline.points
        .map(
          (point, index) =>
            `${index === 0 ? 'M' : 'L'}${point.x.toFixed(PRECISION)} ${point.y.toFixed(PRECISION)}`,
        )
        .join(' '),
    )
    .join(' ');
}
