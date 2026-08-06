import { computeTraceScale, type TraceScale } from '@/ecg/grid';
import type { Lead } from '@/ecg/signal';
import { buildLeadPolylines, type TraceViewport } from '@/ecg/tracePath';

const SAMPLING_RATE_HZ = 500;
const SCALE: TraceScale = computeTraceScale({ speedMmPerSecond: 25, gainMmPerMillivolt: 10 }, 4);
const VIEWPORT: TraceViewport = { fromSecond: 0, toSecond: 10, baselineY: 100 };

/** Muestras planas de la duracion pedida. */
function flat(seconds: number, value = 0): number[] {
  return new Array<number>(Math.round(seconds * SAMPLING_RATE_HZ)).fill(value);
}

/**
 * Una derivacion de rejilla de un 3x4: solo se imprimen 2,5 s de los 10, y en
 * este caso hay ademas una tira de ritmo al pie, asi que hay dos tramos con un
 * hueco de 2,5 s entre medias.
 */
const LEAD_WITH_GAP: Lead = {
  name: 'II',
  segments: [
    { startSecond: 0, values: flat(2.5, 0.5) },
    { startSecond: 5, values: flat(2.5, -0.5) },
  ],
};

describe('buildLeadPolylines', () => {
  // ESTA ES LA PRUEBA CLINICA DE LA ETAPA. Un 3x4 solo imprime 2,5 s por
  // derivacion de rejilla: el resto del tiempo no se registro. Una recta que
  // atraviese ese hueco es una afirmacion sobre lo que hacia el corazon cuando
  // nadie estaba mirando.
  it('produce una polilinea por tramo, nunca una que cruce el hueco', () => {
    const polylines = buildLeadPolylines(LEAD_WITH_GAP, SAMPLING_RATE_HZ, VIEWPORT, SCALE);

    expect(polylines).toHaveLength(2);
  });

  it('no coloca ningun punto dentro del hueco', () => {
    const polylines = buildLeadPolylines(LEAD_WITH_GAP, SAMPLING_RATE_HZ, VIEWPORT, SCALE);

    // De pixeles de vuelta a segundos, para comprobarlo contra el registro.
    const seconds = polylines
      .flatMap((polyline) => polyline.points)
      .map((point) => point.x / SCALE.pixelsPerSecond);

    // El hueco va de 2,5 a 5 s. Ni un solo punto puede caer ahi dentro.
    const insideGap = seconds.filter((second) => second > 2.5 && second < 5);
    expect(insideGap).toEqual([]);
  });

  it('ninguna polilinea abarca mas de lo que dura su tramo', () => {
    const polylines = buildLeadPolylines(LEAD_WITH_GAP, SAMPLING_RATE_HZ, VIEWPORT, SCALE);
    const segmentWidthPx = 2.5 * SCALE.pixelsPerSecond;

    for (const polyline of polylines) {
      const xs = polyline.points.map((point) => point.x);
      expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(segmentWidthPx);
    }
  });

  it('descarta los tramos que quedan fuera de la ventana visible', () => {
    const window: TraceViewport = { fromSecond: 0, toSecond: 2.5, baselineY: 100 };
    const polylines = buildLeadPolylines(LEAD_WITH_GAP, SAMPLING_RATE_HZ, window, SCALE);

    expect(polylines).toHaveLength(1);
  });

  it('invierte el eje vertical: mas milivoltios, menos pixeles', () => {
    const positive: Lead = { name: 'I', segments: [{ startSecond: 0, values: flat(1, 1) }] };
    const [polyline] = buildLeadPolylines(positive, SAMPLING_RATE_HZ, VIEWPORT, SCALE);

    // 1 mV a 10 mm/mV son 10 mm, que a 4 px/mm son 40 px por encima de la base.
    expect(polyline?.points[0]?.y).toBeCloseTo(VIEWPORT.baselineY - 40);
  });

  it('descarta un tramo de una sola muestra, que no dibuja nada', () => {
    const speck: Lead = { name: 'I', segments: [{ startSecond: 0, values: [0.2] }] };

    expect(buildLeadPolylines(speck, SAMPLING_RATE_HZ, VIEWPORT, SCALE)).toEqual([]);
  });
});
