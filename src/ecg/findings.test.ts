import type { EcgObservation, EcgObservationCategory } from '@/ecg/EcgAnalysisService';
import { confidencePercent, summarizeFindings } from '@/ecg/findings';

/** Observacion minima para las pruebas del resumen. */
function obs(
  label: string,
  category: EcgObservationCategory,
  confidence: number,
  id: string = label,
): EcgObservation {
  return {
    id,
    label,
    leads: [],
    confidence,
    needsReview: true,
    aboveThreshold: null,
    category,
  };
}

describe('confidencePercent', () => {
  it('trunca y no redondea: nunca escribe un cien que el modelo no dijo', () => {
    expect(confidencePercent(0.996)).toBe(99);
    expect(confidencePercent(0.4)).toBe(40);
  });

  it('no pierde un punto por la coma flotante', () => {
    // 0.57 * 100 es 56.99999999999999; sin el margen salia «56 %».
    expect(confidencePercent(0.57)).toBe(57);
    expect(confidencePercent(0.29)).toBe(29);
  });

  it('respeta los extremos', () => {
    expect(confidencePercent(0)).toBe(0);
    expect(confidencePercent(1)).toBe(100);
  });
});

describe('summarizeFindings: hallazgo principal', () => {
  it('elige el de mas puntuacion, venga en el orden que venga', () => {
    const { principal } = summarizeFindings([
      obs('RIGHT BUNDLE BRANCH BLOCK', 'conduccion', 0.57),
      obs('ATRIAL FIBRILLATION', 'ritmo', 0.95),
      obs('SINUS RHYTHM', 'ritmo', 0.75),
    ]);

    expect(principal?.observation.label).toBe('ATRIAL FIBRILLATION');
    expect(principal?.categoryTitle).toBe('Ritmo');
  });

  it('ignora los enunciados de resumen aunque puntuen mas', () => {
    const { principal } = summarizeFindings([
      obs('ABNORMAL ECG', 'otro', 0.99),
      obs('LEFT AXIS DEVIATION', 'eje', 0.6),
    ]);

    expect(principal?.observation.label).toBe('LEFT AXIS DEVIATION');
  });

  it('ignora la categoria resumen, que la lista tampoco ensena', () => {
    const { principal } = summarizeFindings([
      obs('ETIQUETA GLOBAL', 'resumen', 0.99),
      obs('SEPTAL INFARCT', 'isquemia_infarto', 0.45),
    ]);

    expect(principal?.observation.label).toBe('SEPTAL INFARCT');
  });

  it('en un empate gana el que la lista ensena antes', () => {
    const { principal } = summarizeFindings([
      obs('LEFT VENTRICULAR HYPERTROPHY', 'hipertrofia', 0.8),
      obs('RIGHT BUNDLE BRANCH BLOCK', 'conduccion', 0.8),
    ]);

    expect(principal?.observation.category).toBe('conduccion');
  });

  it('sin observaciones que mostrar no hay principal ni recuento', () => {
    expect(summarizeFindings([])).toEqual({ principal: null, counts: [] });
    expect(summarizeFindings([obs('NORMAL ECG', 'otro', 0.9)])).toEqual({
      principal: null,
      counts: [],
    });
  });
});

describe('summarizeFindings: recuento por categoria', () => {
  it('cuenta por categoria en el orden de la pantalla y con rotulo corto', () => {
    const { counts } = summarizeFindings([
      obs('LEFT VENTRICULAR HYPERTROPHY', 'hipertrofia', 0.4),
      obs('ATRIAL FIBRILLATION', 'ritmo', 0.95),
      obs('SEPTAL INFARCT', 'isquemia_infarto', 0.45),
      obs('UNDETERMINED RHYTHM', 'ritmo', 0.91),
      obs('RIGHT BUNDLE BRANCH BLOCK', 'conduccion', 0.57),
      obs('SINUS RHYTHM', 'ritmo', 0.75),
      obs('INCOMPLETE RIGHT BUNDLE BRANCH BLOCK', 'conduccion', 0.41),
    ]);

    expect(counts).toEqual([
      { category: 'ritmo', title: 'Ritmo', shortTitle: 'Ritmo', count: 3 },
      { category: 'conduccion', title: 'Conducción', shortTitle: 'Conducción', count: 2 },
      {
        category: 'isquemia_infarto',
        title: 'Isquemia e infarto',
        shortTitle: 'Isquemia',
        count: 1,
      },
      { category: 'hipertrofia', title: 'Hipertrofia', shortTitle: 'Hipertrofia', count: 1 },
    ]);
  });

  it('el recuento suma lo mismo que la lista, sin los resumenes', () => {
    const { counts } = summarizeFindings([
      obs('ABNORMAL ECG', 'otro', 0.9),
      obs('ATRIAL FIBRILLATION', 'ritmo', 0.9, 'a'),
      obs('ETIQUETA GLOBAL', 'resumen', 0.9),
    ]);

    expect(counts.reduce((total, entry) => total + entry.count, 0)).toBe(1);
  });
});
