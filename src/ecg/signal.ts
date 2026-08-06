/**
 * Modelo de la senal digitalizada.
 *
 * Modulo puro. Aqui se toma la decision clinica mas importante de la etapa:
 * **los huecos son estructurales**.
 *
 * Una derivacion no es un arreglo de muestras con ausencias marcadas de algun
 * modo, sino una lista de tramos continuos, cada uno con el segundo en que
 * empieza. Fuera de un tramo NO HAY DATO, y no lo hay de una forma que el tipo
 * obliga a mirar.
 *
 * Por que asi y no con nulos o con NaN. En un 3x4 estandar, cada derivacion de
 * la rejilla solo se imprime durante 2,5 de los 10 segundos: el resto del
 * tiempo esa derivacion no se registro. Con un arreglo de muestras y centinelas,
 * unir dos tramos es un descuido de una linea —un filtro que quita los nulos, un
 * bucle que no comprueba— y el resultado es una recta perfectamente creible
 * atravesando un tramo donde no se sabe que hacia el corazon. Es mentir sobre el
 * paciente con la apariencia de un dato. Con tramos separados, dibujar esa recta
 * exige juntar dos listas a proposito.
 */

/**
 * Nombre de derivacion.
 *
 * Incluye las derechas, que sustituyen a las precordiales izquierdas en el
 * registro que se pide ante sospecha de infarto de ventriculo derecho.
 */
export type LeadName =
  | 'I'
  | 'II'
  | 'III'
  | 'aVR'
  | 'aVL'
  | 'aVF'
  | 'V1'
  | 'V2'
  | 'V3'
  | 'V4'
  | 'V5'
  | 'V6'
  | 'V4R'
  | 'V5R'
  | 'V6R';

/**
 * Un tramo continuo de senal.
 *
 * Sus muestras son consecutivas y estan separadas por el periodo de muestreo.
 * Antes de startSecond y despues del final del tramo no hay dato: no es que
 * valga cero, es que no se registro.
 */
export interface LeadSegment {
  /** Segundo del registro en que empieza el tramo. */
  readonly startSecond: number;
  /** Muestras en milivoltios, consecutivas. */
  readonly values: readonly number[];
}

export interface Lead {
  readonly name: LeadName;
  /** Tramos registrados, en orden temporal y sin solaparse. */
  readonly segments: readonly LeadSegment[];
}

export interface EcgSignal {
  readonly samplingRateHz: number;
  /** Duracion total del registro, incluidos los tramos sin dato. */
  readonly durationSeconds: number;
  readonly leads: readonly Lead[];
}

/**
 * Momento en que cae una muestra de un tramo.
 *
 * @param segment Tramo al que pertenece.
 * @param index Posicion de la muestra dentro del tramo.
 * @param samplingRateHz Frecuencia de muestreo del registro.
 * @returns El segundo del registro en que cae la muestra.
 */
export function sampleSecond(segment: LeadSegment, index: number, samplingRateHz: number): number {
  return segment.startSecond + index / samplingRateHz;
}

/**
 * Duracion de un tramo.
 *
 * @param segment Tramo a medir.
 * @param samplingRateHz Frecuencia de muestreo del registro.
 * @returns Su duracion en segundos.
 */
export function segmentDuration(segment: LeadSegment, samplingRateHz: number): number {
  return segment.values.length / samplingRateHz;
}

/**
 * Segundo en que termina un tramo.
 *
 * @param segment Tramo a medir.
 * @param samplingRateHz Frecuencia de muestreo del registro.
 * @returns El segundo del registro en que acaba.
 */
export function segmentEnd(segment: LeadSegment, samplingRateHz: number): number {
  return segment.startSecond + segmentDuration(segment, samplingRateHz);
}

/**
 * Tramos de una derivacion que caen, aunque sea en parte, dentro de una ventana.
 *
 * Es el filtro que hace barata la ventana visible: descarta tramos enteros
 * antes de decimar nada. Un tramo que solo asoma por un borde se conserva
 * completo; recortarlo por muestras es trabajo del decimado, que ya recorre el
 * tramo de todos modos.
 *
 * @param lead Derivacion a filtrar.
 * @param fromSecond Principio de la ventana.
 * @param toSecond Final de la ventana.
 * @param samplingRateHz Frecuencia de muestreo del registro.
 * @returns Los tramos visibles, en orden.
 */
export function segmentsInWindow(
  lead: Lead,
  fromSecond: number,
  toSecond: number,
  samplingRateHz: number,
): readonly LeadSegment[] {
  return lead.segments.filter(
    (segment) => segment.startSecond < toSecond && segmentEnd(segment, samplingRateHz) > fromSecond,
  );
}
