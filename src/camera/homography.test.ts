import {
  applyToPoint,
  invert3x3,
  multiply3x3,
  quadToQuad,
  unitSquareToQuad,
  type Matrix3x3,
} from '@/camera/homography';
import type { Point, Quad } from '@/camera/quad';

const UNIT_SQUARE: Quad = [
  { x: 0, y: 0 },
  { x: 1, y: 0 },
  { x: 1, y: 1 },
  { x: 0, y: 1 },
];

/** Trapecio: el papel visto desde arriba y en angulo, con el borde lejano mas corto. */
const TRAPEZOID: Quad = [
  { x: 120, y: 80 },
  { x: 880, y: 140 },
  { x: 960, y: 620 },
  { x: 40, y: 700 },
];

const IDENTITY: Matrix3x3 = [1, 0, 0, 0, 1, 0, 0, 0, 1];

function expectPointsClose(actual: Point | null, expected: Point): void {
  expect(actual).not.toBeNull();
  expect(actual?.x).toBeCloseTo(expected.x, 6);
  expect(actual?.y).toBeCloseTo(expected.y, 6);
}

/** Comprueba que la matriz lleva cada esquina del origen a la del destino. */
function expectQuadMapping(matrix: Matrix3x3 | null, source: Quad, target: Quad): void {
  expect(matrix).not.toBeNull();
  const applied = matrix as Matrix3x3;

  const [s0, s1, s2, s3] = source;
  const [t0, t1, t2, t3] = target;

  expectPointsClose(applyToPoint(applied, s0), t0);
  expectPointsClose(applyToPoint(applied, s1), t1);
  expectPointsClose(applyToPoint(applied, s2), t2);
  expectPointsClose(applyToPoint(applied, s3), t3);
}

describe('unitSquareToQuad', () => {
  // Esta es la prueba que justifica el modulo: la formula de Heckbert es facil
  // de transcribir mal y su fallo es silencioso, porque una matriz equivocada
  // sigue produciendo una imagen, solo que deformada.
  it('lleva las cuatro esquinas del cuadrado unidad al cuadrilatero', () => {
    expectQuadMapping(unitSquareToQuad(TRAPEZOID), UNIT_SQUARE, TRAPEZOID);
  });

  it('degrada a transformacion afin cuando el cuadrilatero es un paralelogramo', () => {
    const parallelogram: Quad = [
      { x: 10, y: 10 },
      { x: 110, y: 30 },
      { x: 130, y: 130 },
      { x: 30, y: 110 },
    ];

    const matrix = unitSquareToQuad(parallelogram);
    expect(matrix).not.toBeNull();

    // Sin perspectiva, la ultima fila de la matriz es la de la identidad.
    expect((matrix as Matrix3x3)[6]).toBe(0);
    expect((matrix as Matrix3x3)[7]).toBe(0);

    expectQuadMapping(matrix, UNIT_SQUARE, parallelogram);
  });

  it('devuelve null cuando tres esquinas coinciden', () => {
    const degenerate: Quad = [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 10, y: 10 },
    ];

    expect(unitSquareToQuad(degenerate)).toBeNull();
  });
});

describe('quadToQuad', () => {
  it('lleva cada esquina del origen a su esquina del destino', () => {
    const destination: Quad = [
      { x: 0, y: 0 },
      { x: 500, y: 0 },
      { x: 500, y: 300 },
      { x: 0, y: 300 },
    ];

    expectQuadMapping(quadToQuad(TRAPEZOID, destination), TRAPEZOID, destination);
  });

  it('compuesta con su inversa devuelve el punto de partida', () => {
    const rectangle: Quad = [
      { x: 0, y: 0 },
      { x: 400, y: 0 },
      { x: 400, y: 250 },
      { x: 0, y: 250 },
    ];

    const forward = quadToQuad(TRAPEZOID, rectangle) as Matrix3x3;
    const backward = quadToQuad(rectangle, TRAPEZOID) as Matrix3x3;

    // Un punto interior cualquiera, no una esquina: las esquinas las verifica
    // la prueba anterior y podrian pasar con una matriz mala por casualidad.
    const inside: Point = { x: 500, y: 400 };
    const roundTrip = applyToPoint(backward, applyToPoint(forward, inside) as Point);

    expectPointsClose(roundTrip, inside);
  });

  it('devuelve null cuando el origen es degenerado', () => {
    const collapsed: Quad = [
      { x: 5, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: 5 },
    ];

    expect(quadToQuad(collapsed, TRAPEZOID)).toBeNull();
  });
});

describe('invert3x3', () => {
  it('multiplicada por la original da la identidad', () => {
    const matrix = unitSquareToQuad(TRAPEZOID) as Matrix3x3;
    const inverse = invert3x3(matrix) as Matrix3x3;
    const product = multiply3x3(matrix, inverse);

    // La inversa esta normalizada por el determinante, asi que el producto
    // coincide con la identidad salvo un factor de escala global.
    const [, , , , , , , , scale] = product;
    const normalized = product.map((value) => value / scale);

    for (const [index, expected] of IDENTITY.entries()) {
      expect(normalized[index]).toBeCloseTo(expected, 6);
    }
  });

  it('devuelve null para una matriz singular', () => {
    expect(invert3x3([1, 2, 3, 2, 4, 6, 7, 8, 9])).toBeNull();
  });
});

describe('applyToPoint', () => {
  it('devuelve null en el horizonte de la transformacion', () => {
    // Una matriz cuya coordenada homogenea se anula en x = 1: ese punto no
    // tiene imagen finita y devolver un infinito lo propagaria al dibujo.
    const horizon: Matrix3x3 = [1, 0, 0, 0, 1, 0, -1, 0, 1];

    expect(applyToPoint(horizon, { x: 1, y: 0 })).toBeNull();
    expect(applyToPoint(horizon, { x: 0, y: 0 })).not.toBeNull();
  });
});
