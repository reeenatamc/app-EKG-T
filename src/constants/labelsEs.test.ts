import { isShownObservation, observationLabel } from '@/constants/labelsEs';

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
