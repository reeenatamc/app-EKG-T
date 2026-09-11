import {
  CATEGORY_ORDER,
  groupByCategory,
  isShownObservation,
  observationLabel,
} from '@/constants/labelsEs';
import type { EcgObservation, EcgObservationCategory } from '@/ecg/EcgAnalysisService';

describe('observationLabel', () => {
  it('traduce y pone mayuscula inicial', () => {
    expect(observationLabel('ATRIAL FIBRILLATION')).toBe('Fibrilación auricular');
  });

  it('deja como viene lo que el diccionario no tiene', () => {
    expect(observationLabel('ETIQUETA INVENTADA')).toBe('ETIQUETA INVENTADA');
  });
});

describe('isShownObservation', () => {
  it('oculta los enunciados de resumen y muestra los hallazgos', () => {
    expect(isShownObservation('ABNORMAL ECG')).toBe(false);
    expect(isShownObservation('ATRIAL FIBRILLATION')).toBe(true);
  });
});

/** Observacion minima para las pruebas de agrupacion. */
function obs(id: string, category: EcgObservationCategory): EcgObservation {
  return {
    id,
    label: id,
    leads: [],
    confidence: 0.9,
    needsReview: true,
    aboveThreshold: null,
    category,
  };
}

describe('groupByCategory', () => {
  it('agrupa en el orden fijo de la pantalla, no en el orden de llegada', () => {
    const groups = groupByCategory([obs('a', 'otro'), obs('b', 'ritmo'), obs('c', 'eje')]);

    expect(groups.map((group) => group.category)).toEqual(['ritmo', 'eje', 'otro']);
  });

  it('no devuelve un grupo sin observaciones', () => {
    const groups = groupByCategory([obs('a', 'ritmo')]);

    expect(groups).toHaveLength(1);
    expect(groups[0]?.title).toBe('Ritmo');
  });

  it('resumen no forma grupo', () => {
    const groups = groupByCategory([obs('a', 'resumen' as EcgObservationCategory)]);

    expect(groups).toHaveLength(0);
  });

  it('cubre las nueve categorias agrupables, con su titulo', () => {
    const observations = CATEGORY_ORDER.map((category, index) => obs(`o${index}`, category));

    const groups = groupByCategory(observations);

    expect(groups).toHaveLength(CATEGORY_ORDER.length);
  });
});
