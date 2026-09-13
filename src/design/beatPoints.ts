/**
 * El latido de SKILL.md §8, como vertices.
 *
 * Linea de base, onda P, complejo QRS y onda T. La honestidad anatomica es la
 * diferencia entre disenar *sobre* el tema y disenar *desde* el tema, asi que
 * la forma no se retoca por motivos esteticos.
 *
 * VIVE SIN SKIA A PROPOSITO. Lo usan el trazado difuso del fondo, el indicador
 * de proceso, el corazon del arranque y el script que genera los iconos, que
 * corre en Node. Un unico latido, una unica anatomia.
 */

/** Sistema de coordenadas en que se dibujo el latido. */
export const BEAT_VIEWBOX = { width: 1200, height: 400 } as const;

/** Altura de la linea de base dentro del sistema del latido. */
export const BEAT_BASELINE = 200;

export type BeatPoint = readonly [number, number];

export const BEAT_POINTS: readonly BeatPoint[] = [
  [0, 200],
  [180, 200],
  [200, 190],
  [220, 210],
  [240, 200],
  [300, 200],
  [310, 120],
  [325, 300],
  [340, 120],
  [360, 200],
  [440, 200],
  [470, 160],
  [510, 200],
  [1200, 200],
];

/**
 * Convierte vertices en un path SVG de segmentos rectos.
 *
 * @param points Vertices del trazo.
 * @returns La cadena SVG.
 */
export function beatSvg(points: readonly BeatPoint[]): string {
  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
}

/**
 * El mismo latido con el complejo desplazado en horizontal.
 *
 * Solo se mueven las ondas; los extremos de la linea de base se quedan en los
 * bordes. La morfologia no cambia: es el mismo registro visto un poco despues.
 *
 * @param dx Desplazamiento en unidades del latido.
 * @returns Los vertices desplazados.
 */
export function shiftBeat(dx: number): BeatPoint[] {
  const last = BEAT_POINTS.length - 1;

  return BEAT_POINTS.map(([x, y], index) => (index === 0 || index === last ? [x, y] : [x + dx, y]));
}

/**
 * Longitud recorrida hasta cada vertice, como fraccion del total.
 *
 * Skia recorta un trazo por longitud, no por abscisa. Para saber en que momento
 * de la animacion pasa la pluma por el QRS hay que medir, no suponer.
 *
 * @param points Vertices del trazo.
 * @returns Una fraccion entre 0 y 1 por vertice.
 */
export function lengthFractions(points: readonly BeatPoint[]): number[] {
  const cumulative = [0];

  for (let index = 1; index < points.length; index += 1) {
    const [x0, y0] = points[index - 1] ?? [0, 0];
    const [x1, y1] = points[index] ?? [0, 0];
    cumulative.push((cumulative[index - 1] ?? 0) + Math.hypot(x1 - x0, y1 - y0));
  }

  const total = cumulative[cumulative.length - 1] ?? 1;
  return cumulative.map((length) => length / total);
}
