import { presentLeads, rhythmStripLeads } from '@/ecg/leads';
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

describe('rhythmStripLeads sobre una hoja real', () => {
  /** Una senal donde cada derivacion cubre, desde el segundo 0, la fraccion que se le diga. */
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

  it('LAS TIRAS SON LAS QUE TRAE LA HOJA, NO II POR CONVENCION', () => {
    // Medido en una hoja real: las tiras eran V1, V5 y V6, y de II solo existia
    // su celda de la rejilla, dos segundos y medio. Pintar una tira rotulada II
    // con un cuarto de trazo se lee como senal perdida.
    const signal = signalCovering({ I: 0.25, II: 0.25, V1: 1, V5: 1, V6: 1 });

    expect(rhythmStripLeads(signal, 'rhythm-3x4')).toEqual(['V1', 'V5', 'V6']);
  });

  it('sin ninguna derivacion a lo largo del papel no hay tira', () => {
    // Mejor no dibujar la fila que dibujar un munon.
    const signal = signalCovering({ I: 0.25, II: 0.25, V1: 0.25 });

    expect(rhythmStripLeads(signal, 'rhythm-3x4')).toEqual([]);
  });
});
