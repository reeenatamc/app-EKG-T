import {
  clampPointToRect,
  expandRect,
  isConvexQuad,
  quadBounds,
  rectToQuad,
  scaleQuad,
  translateQuadToOrigin,
  type Quad,
} from '@/camera/quad';

const TRAPEZOID: Quad = [
  { x: 120, y: 80 },
  { x: 880, y: 140 },
  { x: 960, y: 620 },
  { x: 40, y: 700 },
];

describe('quadBounds', () => {
  it('contiene las cuatro esquinas', () => {
    const bounds = quadBounds(TRAPEZOID);

    expect(bounds).toEqual({ x: 40, y: 80, width: 920, height: 620 });
  });
});

describe('rectToQuad', () => {
  it('produce las esquinas en el orden del contrato', () => {
    const quad = rectToQuad({ x: 10, y: 20, width: 100, height: 50 });

    expect(quad).toEqual([
      { x: 10, y: 20 },
      { x: 110, y: 20 },
      { x: 110, y: 70 },
      { x: 10, y: 70 },
    ]);
  });
});

describe('clampPointToRect', () => {
  it('deja pasar un punto interior', () => {
    const bounds = { x: 0, y: 0, width: 100, height: 100 };

    expect(clampPointToRect({ x: 30, y: 40 }, bounds)).toEqual({ x: 30, y: 40 });
  });

  it('confina un punto que se sale por dos lados', () => {
    const bounds = { x: 10, y: 10, width: 100, height: 100 };

    expect(clampPointToRect({ x: -50, y: 500 }, bounds)).toEqual({ x: 10, y: 110 });
  });
});

describe('expandRect', () => {
  it('anade margen por los cuatro lados', () => {
    const bounds = { x: 0, y: 0, width: 1000, height: 1000 };
    const expanded = expandRect({ x: 100, y: 100, width: 200, height: 100 }, 0.1, bounds);

    expect(expanded).toEqual({ x: 80, y: 90, width: 240, height: 120 });
  });

  it('no sobrepasa el limite cuando el rectangulo ya toca el borde', () => {
    const bounds = { x: 0, y: 0, width: 400, height: 400 };
    const expanded = expandRect({ x: 0, y: 350, width: 400, height: 50 }, 0.2, bounds);

    expect(expanded).toEqual({ x: 0, y: 340, width: 400, height: 60 });
  });
});

describe('isConvexQuad', () => {
  it('acepta un trapecio', () => {
    expect(isConvexQuad(TRAPEZOID)).toBe(true);
  });

  it('acepta un rectangulo', () => {
    expect(isConvexQuad(rectToQuad({ x: 0, y: 0, width: 10, height: 10 }))).toBe(true);
  });

  // El caso que rompe la revision: arrastrar la esquina superior derecha por
  // debajo de la inferior derecha cruza dos lados. La homografia resultante
  // pliega la imagen sobre si misma.
  it('rechaza un cuadrilatero cruzado en corbata de lazo', () => {
    const bowtie: Quad = [
      { x: 0, y: 0 },
      { x: 100, y: 100 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ];

    expect(isConvexQuad(bowtie)).toBe(false);
  });

  it('rechaza tres esquinas alineadas', () => {
    const flattened: Quad = [
      { x: 0, y: 0 },
      { x: 50, y: 0 },
      { x: 100, y: 0 },
      { x: 0, y: 100 },
    ];

    expect(isConvexQuad(flattened)).toBe(false);
  });
});

describe('translateQuadToOrigin', () => {
  it('expresa las esquinas en coordenadas del recorte', () => {
    const translated = translateQuadToOrigin(TRAPEZOID, quadBounds(TRAPEZOID));

    // Tras trasladar, la esquina mas a la izquierda queda en x = 0 y la mas
    // alta en y = 0: es justo lo que el servidor espera recibir.
    expect(Math.min(...translated.map((point) => point.x))).toBe(0);
    expect(Math.min(...translated.map((point) => point.y))).toBe(0);
    expect(translated[0]).toEqual({ x: 80, y: 0 });
  });
});

describe('scaleQuad', () => {
  it('reescala las cuatro esquinas por igual', () => {
    const scaled = scaleQuad(rectToQuad({ x: 10, y: 10, width: 100, height: 100 }), 2.5);

    expect(scaled[0]).toEqual({ x: 25, y: 25 });
    expect(scaled[2]).toEqual({ x: 275, y: 275 });
  });
});
