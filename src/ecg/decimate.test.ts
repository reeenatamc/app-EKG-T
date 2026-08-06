import { decimateSegment } from '@/ecg/decimate';

const SAMPLING_RATE_HZ = 500;

describe('decimateSegment', () => {
  // La razon de ser del modulo. Un muestreo por salto de veinte muestras tiene
  // diecinueve posibilidades entre veinte de saltarse este pico, y el trazado
  // saldria suave, creible y con la amplitud del QRS rebajada.
  it('conserva el pico R aunque dure una sola muestra', () => {
    const values = new Array<number>(1000).fill(0);
    values[500] = 2.5;

    const points = decimateSegment(values, 0, SAMPLING_RATE_HZ, 50);

    expect(Math.max(...points.map((point) => point.y))).toBe(2.5);
    expect(points.length).toBeLessThanOrEqual(50);
  });

  it('conserva tambien el minimo, que es la onda S', () => {
    const values = new Array<number>(1000).fill(0);
    values[400] = 1.8;
    values[420] = -0.9;

    const ys = decimateSegment(values, 0, SAMPLING_RATE_HZ, 40).map((point) => point.y);

    expect(Math.max(...ys)).toBe(1.8);
    expect(Math.min(...ys)).toBe(-0.9);
  });

  it('devuelve las muestras tal cual si ya caben', () => {
    const values = [0, 0.1, 0.2, 0.1];

    const points = decimateSegment(values, 0, SAMPLING_RATE_HZ, 100);

    expect(points.map((point) => point.y)).toEqual(values);
  });

  it('coloca cada punto en el segundo que le toca', () => {
    const points = decimateSegment([0, 1, 2, 3], 4, SAMPLING_RATE_HZ, 100);

    expect(points[0]?.x).toBeCloseTo(4);
    expect(points[3]?.x).toBeCloseTo(4 + 3 / SAMPLING_RATE_HZ);
  });

  // Emitir siempre el minimo antes que el maximo convertiria una rampa suave en
  // un diente de sierra, que en un trazado clinico se lee como artefacto.
  it('respeta el orden temporal dentro de cada cubo', () => {
    const rising = Array.from({ length: 200 }, (_, index) => index / 200);

    const xs = decimateSegment(rising, 0, SAMPLING_RATE_HZ, 20).map((point) => point.x);

    for (let index = 1; index < xs.length; index += 1) {
      expect(xs[index]).toBeGreaterThanOrEqual(xs[index - 1] ?? 0);
    }
  });

  it('devuelve vacio para un tramo sin muestras', () => {
    expect(decimateSegment([], 0, SAMPLING_RATE_HZ, 10)).toEqual([]);
  });
});
