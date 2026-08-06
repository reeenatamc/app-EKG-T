/**
 * Reduccion de muestras para dibujar.
 *
 * Modulo puro. Un registro de diez segundos a 500 Hz son cinco mil muestras por
 * derivacion y sesenta mil en total; una pantalla de telefono tiene unos
 * cuatrocientos puntos de ancho. Dibujarlas todas gasta memoria y tiempo en
 * puntos que caen sobre el mismo pixel.
 *
 * SE DECIMA POR MINIMO Y MAXIMO, NO POR SALTO. Tomar una muestra de cada N es
 * mas simple y esta mal: el complejo QRS dura unos 80 ms y su pico es un solo
 * punto: con un salto de diez muestras hay nueve posibilidades entre diez de
 * saltarselo. El trazado resultante sale suave, creible y con el pico R rebajado
 * o desaparecido, que es justo la amplitud que se mide. Un trazado roto se ve;
 * uno plausible y equivocado, no.
 *
 * Conservando el minimo y el maximo de cada cubo, la envolvente de la senal se
 * mantiene exacta a la resolucion de la pantalla.
 */

export interface Point {
  readonly x: number;
  readonly y: number;
}

/** Muestras por cubo cuando hay que decimar: una para el minimo y otra para el maximo. */
const POINTS_PER_BUCKET = 2;

/**
 * Reduce un tramo a como mucho maxPoints puntos, conservando los extremos.
 *
 * Dentro de cada cubo, el minimo y el maximo se emiten en el orden en que
 * aparecen en la senal. Emitirlos siempre en el mismo orden convertiria una
 * linea suave en un diente de sierra.
 *
 * @param values Muestras del tramo, en milivoltios.
 * @param startSecond Segundo del registro en que empieza el tramo.
 * @param samplingRateHz Frecuencia de muestreo.
 * @param maxPoints Techo de puntos a devolver.
 * @returns Los puntos, con x en segundos e y en milivoltios.
 */
export function decimateSegment(
  values: readonly number[],
  startSecond: number,
  samplingRateHz: number,
  maxPoints: number,
): readonly Point[] {
  const toPoint = (index: number): Point => ({
    x: startSecond + index / samplingRateHz,
    y: values[index] ?? 0,
  });

  if (values.length === 0) {
    return [];
  }

  // Con pocas muestras no hay nada que reducir, y reducirlas igualmente
  // introduciria el error sin ganar nada.
  if (values.length <= maxPoints) {
    return values.map((_, index) => toPoint(index));
  }

  const buckets = Math.max(1, Math.floor(maxPoints / POINTS_PER_BUCKET));
  const bucketSize = values.length / buckets;

  return Array.from({ length: buckets })
    .flatMap((_, bucket) =>
      bucketIndices(
        values,
        Math.floor(bucket * bucketSize),
        Math.min(values.length, Math.floor((bucket + 1) * bucketSize)),
      ),
    )
    .map(toPoint);
}

/**
 * Indices a conservar de un cubo: su minimo y su maximo.
 *
 * Se devuelven en el orden en que ocurren, no siempre el minimo primero.
 * Emitirlos siempre igual convertiria una rampa suave en un diente de sierra,
 * que en un trazado clinico se lee como artefacto.
 *
 * @param values Muestras del tramo.
 * @param from Primer indice del cubo, incluido.
 * @param to Ultimo indice del cubo, excluido.
 * @returns Uno o dos indices, o ninguno si el cubo esta vacio.
 */
function bucketIndices(values: readonly number[], from: number, to: number): readonly number[] {
  const extremes = findExtremes(values, from, to);
  if (extremes === null) {
    return [];
  }

  const { minIndex, maxIndex } = extremes;
  if (minIndex === maxIndex) {
    return [minIndex];
  }

  return minIndex < maxIndex ? [minIndex, maxIndex] : [maxIndex, minIndex];
}

interface Extremes {
  readonly minIndex: number;
  readonly maxIndex: number;
}

/**
 * Encuentra las posiciones del minimo y el maximo de un rango.
 *
 * @param values Muestras.
 * @param from Primer indice, incluido.
 * @param to Ultimo indice, excluido.
 * @returns Las posiciones, o null si el rango esta vacio.
 */
function findExtremes(values: readonly number[], from: number, to: number): Extremes | null {
  if (to <= from) {
    return null;
  }

  let minIndex = from;
  let maxIndex = from;

  for (let index = from + 1; index < to; index += 1) {
    const value = values[index] ?? 0;
    if (value < (values[minIndex] ?? 0)) {
      minIndex = index;
    }
    if (value > (values[maxIndex] ?? 0)) {
      maxIndex = index;
    }
  }

  return { minIndex, maxIndex };
}
