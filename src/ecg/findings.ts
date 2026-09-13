import {
  CATEGORY_SHORT_TITLES,
  groupByCategory,
  isShownObservation,
  type ObservationGroup,
} from '@/constants/labelsEs';
import type { EcgObservation, EcgObservationCategory } from '@/ecg/EcgAnalysisService';

/**
 * Resumen de la lectura para la tarjeta del detalle.
 *
 * SALE DE LA MISMA AGRUPACION QUE LA LISTA. La tarjeta y la hoja de hallazgos
 * cuentan lo mismo dos veces, una en grande y otra entera, y si cada una filtrara
 * por su cuenta acabarian contando cosas distintas: un enunciado de resumen como
 * «ECG anormal» podria salir de hallazgo principal sin aparecer en la lista.
 */

const PERCENT = 100;

/**
 * Margen contra el error de coma flotante al pasar a porcentaje.
 *
 * `0.57 * 100` da 56.99999999999999 en coma flotante, y truncar eso escribia
 * «56 %» para una puntuacion de 0,57. El margen es muy inferior a la centesima,
 * asi que no puede convertir un 0,996 en un cien.
 */
const FLOAT_TOLERANCE = 1e-9;

/** Cuantos hallazgos hay en una categoria. */
export interface CategoryCount {
  readonly category: Exclude<EcgObservationCategory, 'resumen'>;
  /** Rotulo entero: es el que oye un lector de pantalla. */
  readonly title: string;
  /** Rotulo que cabe en una columna de la tarjeta. */
  readonly shortTitle: string;
  readonly count: number;
}

/** El hallazgo de mas puntuacion y el rotulo del grupo en que la lista lo ensena. */
export interface PrincipalFinding {
  readonly observation: EcgObservation;
  readonly categoryTitle: string;
}

export interface FindingsSummary {
  /** El de mas puntuacion, o null si la lectura no trae ninguno que mostrar. */
  readonly principal: PrincipalFinding | null;
  /** Una entrada por categoria no vacia, en el orden de la pantalla. */
  readonly counts: readonly CategoryCount[];
}

/**
 * Confianza en porcentaje entero.
 *
 * SE TRUNCA, NO SE REDONDEA. Redondear convierte 0,996 en «100 %», y eso es una
 * certeza que el modelo no ha afirmado: sus salidas no son probabilidades
 * calibradas. Una aplicacion que pide confirmar la lectura no puede a la vez
 * escribir un cien por cien.
 *
 * @param confidence Puntuacion entre 0 y 1.
 * @returns El porcentaje truncado.
 */
export function confidencePercent(confidence: number): number {
  return Math.floor(confidence * PERCENT + FLOAT_TOLERANCE);
}

/**
 * Las observaciones que se ensenan, ya agrupadas.
 *
 * @param observations Observaciones crudas del analisis.
 * @returns Los grupos no vacios, en el orden de la pantalla.
 */
export function listedGroups(observations: readonly EcgObservation[]): readonly ObservationGroup[] {
  return groupByCategory(
    observations.filter((observation) => isShownObservation(observation.label)),
  );
}

/**
 * El hallazgo de mas puntuacion.
 *
 * UN EMPATE LO GANA EL QUE VA ANTES EN LA LISTA, o sea el de la categoria que la
 * pantalla ensena primero. Asi la tarjeta y la primera fila con esa cifra
 * coinciden, y el resultado no depende del orden en que llegaron del servidor.
 *
 * @param groups Grupos de `listedGroups`.
 * @returns La observacion con su categoria, o null si no hay ninguna.
 */
export function principalFinding(groups: readonly ObservationGroup[]): PrincipalFinding | null {
  let best: PrincipalFinding | null = null;

  for (const group of groups) {
    for (const observation of group.observations) {
      // Estrictamente mayor: en un empate se queda el que ya iba antes.
      if (best === null || observation.confidence > best.observation.confidence) {
        best = { observation, categoryTitle: group.title };
      }
    }
  }

  return best;
}

/**
 * Cuantos hallazgos hay en cada categoria.
 *
 * @param groups Grupos de `listedGroups`.
 * @returns Una entrada por grupo, con el rotulo corto que cabe en la tarjeta.
 */
export function countByCategory(groups: readonly ObservationGroup[]): readonly CategoryCount[] {
  return groups.map((group) => ({
    category: group.category,
    title: group.title,
    shortTitle: CATEGORY_SHORT_TITLES[group.category],
    count: group.observations.length,
  }));
}

/**
 * Hallazgo principal y recuento por categoria, de una vez.
 *
 * @param observations Observaciones crudas del analisis.
 * @returns El resumen para la tarjeta.
 */
export function summarizeFindings(observations: readonly EcgObservation[]): FindingsSummary {
  const groups = listedGroups(observations);

  return { principal: principalFinding(groups), counts: countByCategory(groups) };
}
