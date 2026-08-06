/**
 * Homografia entre cuadrilateros.
 *
 * Modulo puro. Es la transformacion que endereza el papel fotografiado en
 * angulo: convierte el trapecio que ve la camara en el rectangulo que fue el
 * papel. Se usa solo para la previsualizacion; la correccion que llega al
 * servidor viaja como las cuatro esquinas, no como pixeles ya remuestreados.
 *
 * Ese reparto es deliberado y es la decision central de la etapa. Corregir aqui
 * obligaria a remuestrear la imagen sobre una GPU de gama media con el filtro
 * que toque, y el remuestreo es justo donde se pierde la senal de un trazado de
 * un milimetro. El servidor tiene la imagen a resolucion nativa y herramientas
 * mejores; que corrija el que puede hacerlo sin perder informacion.
 *
 * La formulacion es la de Heckbert, "Fundamentals of Texture Mapping and Image
 * Warping", seccion 2.2: en lugar de resolver un sistema de ocho incognitas se
 * pasa por el cuadrado unidad, que tiene solucion cerrada. Las pruebas
 * verifican numericamente que las cuatro esquinas caen donde deben, porque una
 * transcripcion de esta formula es facil de equivocar y silenciosa cuando falla.
 */

import type { Point, Quad } from '@/camera/quad';

/**
 * Matriz 3x3 en orden por filas.
 *
 * Transforma puntos como columna: [X, Y, W] = M x [x, y, 1], y el punto
 * resultante es (X/W, Y/W).
 */
export type Matrix3x3 = readonly [
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

/** Por debajo de esta magnitud un determinante se considera nulo. */
const SINGULAR_EPSILON = 1e-12;

/**
 * Homografia que lleva el cuadrado unidad al cuadrilatero dado.
 *
 * Las esquinas del cuadrado unidad se corresponden en el orden del contrato de
 * Quad: (0,0) a la superior izquierda, (1,0) a la superior derecha, (1,1) a la
 * inferior derecha y (0,1) a la inferior izquierda.
 *
 * Cuando el cuadrilatero es un paralelogramo la transformacion es afin y los
 * terminos de perspectiva se anulan. Ese caso se trata aparte porque su
 * denominador comun tambien se anula.
 *
 * @param quad Cuadrilatero destino.
 * @returns La matriz, o null si el cuadrilatero es degenerado.
 */
export function unitSquareToQuad(quad: Quad): Matrix3x3 | null {
  const [p0, p1, p2, p3] = quad;

  const sx = p0.x - p1.x + p2.x - p3.x;
  const sy = p0.y - p1.y + p2.y - p3.y;

  if (sx === 0 && sy === 0) {
    return [p1.x - p0.x, p2.x - p1.x, p0.x, p1.y - p0.y, p2.y - p1.y, p0.y, 0, 0, 1];
  }

  const dx1 = p1.x - p2.x;
  const dx2 = p3.x - p2.x;
  const dy1 = p1.y - p2.y;
  const dy2 = p3.y - p2.y;

  const denominator = dx1 * dy2 - dx2 * dy1;
  if (Math.abs(denominator) < SINGULAR_EPSILON) {
    return null;
  }

  const g = (sx * dy2 - dx2 * sy) / denominator;
  const h = (dx1 * sy - sx * dy1) / denominator;

  return [
    p1.x - p0.x + g * p1.x,
    p3.x - p0.x + h * p3.x,
    p0.x,
    p1.y - p0.y + g * p1.y,
    p3.y - p0.y + h * p3.y,
    p0.y,
    g,
    h,
    1,
  ];
}

/**
 * Homografia que lleva un cuadrilatero a otro.
 *
 * Se compone pasando por el cuadrado unidad: se deshace el primero y se aplica
 * el segundo.
 *
 * @param source Cuadrilatero de partida.
 * @param destination Cuadrilatero de llegada.
 * @returns La matriz, o null si alguno de los dos es degenerado.
 */
export function quadToQuad(source: Quad, destination: Quad): Matrix3x3 | null {
  const fromUnit = unitSquareToQuad(source);
  const toUnit = fromUnit === null ? null : invert3x3(fromUnit);
  const target = unitSquareToQuad(destination);

  if (toUnit === null || target === null) {
    return null;
  }

  return multiply3x3(target, toUnit);
}

/**
 * Invierte una matriz 3x3.
 *
 * @param m Matriz a invertir.
 * @returns La inversa, o null si la matriz es singular.
 */
export function invert3x3(m: Matrix3x3): Matrix3x3 | null {
  const [a, b, c, d, e, f, g, h, i] = m;

  const cofactorA = e * i - f * h;
  const cofactorB = f * g - d * i;
  const cofactorC = d * h - e * g;

  const determinant = a * cofactorA + b * cofactorB + c * cofactorC;
  if (Math.abs(determinant) < SINGULAR_EPSILON) {
    return null;
  }

  return [
    cofactorA / determinant,
    (c * h - b * i) / determinant,
    (b * f - c * e) / determinant,
    cofactorB / determinant,
    (a * i - c * g) / determinant,
    (c * d - a * f) / determinant,
    cofactorC / determinant,
    (b * g - a * h) / determinant,
    (a * e - b * d) / determinant,
  ];
}

/**
 * Multiplica dos matrices 3x3.
 *
 * @param left Matriz izquierda.
 * @param right Matriz derecha.
 * @returns El producto left x right.
 */
export function multiply3x3(left: Matrix3x3, right: Matrix3x3): Matrix3x3 {
  // Escrito termino a termino en vez de con dos bucles anidados. Con indices
  // calculados, TypeScript no puede saber que caen dentro de la tupla y obliga
  // a comprobar nueve accesos que jamas fallan; desplegado, el tipo se
  // comprueba solo y la formula queda a la vista.
  const [a0, a1, a2, a3, a4, a5, a6, a7, a8] = left;
  const [b0, b1, b2, b3, b4, b5, b6, b7, b8] = right;

  return [
    a0 * b0 + a1 * b3 + a2 * b6,
    a0 * b1 + a1 * b4 + a2 * b7,
    a0 * b2 + a1 * b5 + a2 * b8,
    a3 * b0 + a4 * b3 + a5 * b6,
    a3 * b1 + a4 * b4 + a5 * b7,
    a3 * b2 + a4 * b5 + a5 * b8,
    a6 * b0 + a7 * b3 + a8 * b6,
    a6 * b1 + a7 * b4 + a8 * b7,
    a6 * b2 + a7 * b5 + a8 * b8,
  ];
}

/**
 * Aplica una homografia a un punto.
 *
 * @param m Matriz de transformacion.
 * @param point Punto de partida.
 * @returns El punto transformado, o null si cae sobre el horizonte de la
 *   transformacion, donde la coordenada homogenea se anula y el resultado no es
 *   representable.
 */
export function applyToPoint(m: Matrix3x3, point: Point): Point | null {
  const w = m[6] * point.x + m[7] * point.y + m[8];
  if (Math.abs(w) < SINGULAR_EPSILON) {
    return null;
  }

  return {
    x: (m[0] * point.x + m[1] * point.y + m[2]) / w,
    y: (m[3] * point.x + m[4] * point.y + m[5]) / w,
  };
}
