import { presentLeads, rhythmLeadFor } from '@/ecg/leads';
import type { EcgSignal } from '@/ecg/signal';

/** Una senal con las derivaciones que se le pidan y un tramo cualquiera. */
function signalWith(...names: readonly string[]): EcgSignal {
  return {
    samplingRateHz: 500,
    durationSeconds: 10,
    leads: names.map((name) => ({
      name: name as EcgSignal['leads'][number]['name'],
      segments: [{ startSecond: 0, values: [0, 0.1] }],
    })),
  };
}

describe('presentLeads', () => {
  it('devuelve las derivaciones que la observacion nombra y la senal tiene', () => {
    const signal = signalWith('I', 'II', 'V1', 'V5');

    expect(presentLeads(signal, ['II', 'V5'])).toEqual(['II', 'V5']);
  });

  it('DESCARTA LAS QUE LA SENAL NO TRAE', () => {
    // El modelo nombra la derivacion en la que se apoya, pero puede nombrar una
    // que la digitalizacion no recupero. En un 3x4 eso pasa en cuanto una
    // derivacion se queda fuera del recorte.
    const signal = signalWith('V1', 'V2');

    expect(presentLeads(signal, ['II', 'V1'])).toEqual(['V1']);
  });

  it('sin ninguna presente devuelve null, no una lista vacia', () => {
    // Es la diferencia entre "enfoca estas" y "no enfoques nada". Con una lista
    // vacia el visor atenuaria las doce derivaciones y pareceria apagado.
    const signal = signalWith('V1', 'V2');

    expect(presentLeads(signal, ['III', 'aVF'])).toBeNull();
  });

  it('una observacion sin derivaciones tampoco enfoca nada', () => {
    expect(presentLeads(signalWith('I', 'II'), [])).toBeNull();
  });

  it('respeta el orden de la senal, no el de la observacion', () => {
    // El visor las pinta en el orden del montaje. Devolverlas en el orden en que
    // las nombro el modelo no cambiaria nada hoy, pero invitaria a asumir que
    // ese orden significa algo.
    const signal = signalWith('I', 'II', 'III');

    expect(presentLeads(signal, ['III', 'I'])).toEqual(['I', 'III']);
  });
});

describe('rhythmLeadFor', () => {
  /** Una senal donde cada derivacion cubre la fraccion que se le diga. */
  function signalCovering(coverage: Readonly<Record<string, number>>): EcgSignal {
    const samplingRateHz = 500;
    const durationSeconds = 10;

    return {
      samplingRateHz,
      durationSeconds,
      leads: Object.entries(coverage).map(([name, fraction]) => ({
        name: name as EcgSignal['leads'][number]['name'],
        segments: [
          {
            startSecond: 0,
            values: Array<number>(Math.round(fraction * durationSeconds * samplingRateHz)).fill(0),
          },
        ],
      })),
    };
  }

  it('LA TIRA SALE DE LA SENAL, NO DEL MONTAJE', () => {
    // Medido en una hoja real: las tiras eran V1, V5 y V6, y el visor pintaba
    // una rotulada II con dos segundos y medio, porque de II solo existia su
    // celda de la rejilla. Una tira cortada a un cuarto parece senal perdida.
    const signal = signalCovering({ I: 0.25, II: 0.25, V1: 1, V5: 1, V6: 1 });

    expect(rhythmLeadFor(signal)).toBe('V1');
  });

  it('prefiere II cuando esta entera, que es la convencion', () => {
    const signal = signalCovering({ II: 1, V1: 1, V5: 1 });

    expect(rhythmLeadFor(signal)).toBe('II');
  });

  it('sin ninguna entera no hay tira que pintar', () => {
    // Mejor no dibujar la fila que dibujar un muñon.
    const signal = signalCovering({ I: 0.25, II: 0.25, V1: 0.25 });

    expect(rhythmLeadFor(signal)).toBeNull();
  });

  it('una derivacion casi entera cuenta como entera', () => {
    // La digitalizacion pierde muestras en los bordes; exigir el cien por cien
    // dejaria sin tira a hojas que si la tienen.
    const signal = signalCovering({ II: 0.95 });

    expect(rhythmLeadFor(signal)).toBe('II');
  });
});
