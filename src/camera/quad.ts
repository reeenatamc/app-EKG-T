/**
 * Geometria del cuadrilatero de recorte.
 *
 * Modulo puro. Separa la geometria de los gestos para poder razonar sobre ella
 * sin un dedo en la pantalla: los casos que rompen esta pantalla —una esquina
 * arrastrada sobre otra, un cuadrilatero cruzado en corbata de lazo— son
 * geometricos, no de interaccion.
 */

import type { Rect, Size } from '@/camera/framing';

export interface Point {
  readonly x: number;
  readonly y: number;
}

/**
 * Cuadrilatero de cuatro esquinas en orden fijo: superior izquierda, superior
 * derecha, inferior derecha, inferior izquierda.
 *
 * El orden es parte del contrato, no una convencion suelta: la homografia lo
 * usa para saber que esquina del papel corresponde a cada esquina de la imagen
 * corregida. Un cuadrilatero con las esquinas permutadas produce una
 * previsualizacion girada o reflejada, no un error.
 */
export type Quad = readonly [Point, Point, Point, Point];

export const CORNER_INDICES = [0, 1, 2, 3] as const;
export type CornerIndex = (typeof CORNER_INDICES)[number];

/**
 * Rectangulo minimo que contiene al cuadrilatero.
 *
 * Es la region que se recorta y se envia: contiene todo el papel que el usuario
 * delimito sin reescalar un solo pixel. La correccion de perspectiva se aplica
 * despues, en el servidor, sobre estos mismos pixeles.
 *
 * @param quad Cuadrilatero en coordenadas de la imagen.
 * @returns El rectangulo que lo contiene.
 */
export function quadBounds(quad: Quad): Rect {
  const xs = quad.map((point) => point.x);
  const ys = quad.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);

  return { x: minX, y: minY, width: Math.max(...xs) - minX, height: Math.max(...ys) - minY };
}

/**
 * Estima que forma tenia el papel antes de la perspectiva.
 *
 * Hace falta para saber con que proporcion dibujar la previsualizacion
 * enderezada. La perspectiva acorta el borde lejano, asi que ninguno de los
 * cuatro lados mide lo que medía el papel; promediar cada par de lados opuestos
 * reparte ese error y da una estimacion suficiente para dibujar.
 *
 * No pretende ser una reconstruccion metrica: para eso haria falta conocer la
 * distancia focal de la camara. La medida de verdad la hace el servidor, que
 * ademas sabe que un electrocardiograma tiene una retícula de un milimetro con
 * la que calibrarse.
 *
 * @param quad Cuadrilatero del papel en la imagen.
 * @returns Ancho y alto estimados del papel enderezado.
 */
export function estimateRectifiedSize(quad: Quad): Size {
  const [p0, p1, p2, p3] = quad;

  return {
    width: (distance(p0, p1) + distance(p3, p2)) / 2,
    height: (distance(p0, p3) + distance(p1, p2)) / 2,
  };
}

function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Confina un punto dentro de un rectangulo.
 *
 * @param point Punto a confinar.
 * @param bounds Rectangulo limite.
 * @returns El punto dentro de los limites.
 */
export function clampPointToRect(point: Point, bounds: Rect): Point {
  return {
    x: Math.min(Math.max(point.x, bounds.x), bounds.x + bounds.width),
    y: Math.min(Math.max(point.y, bounds.y), bounds.y + bounds.height),
  };
}

/**
 * Convierte un rectangulo en cuadrilatero, en el orden del contrato.
 *
 * @param rect Rectangulo de partida.
 * @returns El cuadrilatero equivalente.
 */
export function rectToQuad(rect: Rect): Quad {
  const right = rect.x + rect.width;
  const bottom = rect.y + rect.height;

  return [
    { x: rect.x, y: rect.y },
    { x: right, y: rect.y },
    { x: right, y: bottom },
    { x: rect.x, y: bottom },
  ];
}

/**
 * Agranda un rectangulo una fraccion de su tamano, sin salirse de un limite.
 *
 * Se usa para capturar algo mas de lo que el marco encuadra. Un margen pequeno
 * alrededor permite que las esquinas se arrastren hacia afuera en la revision y
 * recuperen un borde del papel que quedo justo fuera de la guia, que es el
 * ajuste que mas se pide en la practica.
 *
 * @param rect Rectangulo de partida.
 * @param ratio Fraccion de ancho y alto a anadir por cada lado.
 * @param bounds Limite que el resultado no puede sobrepasar.
 * @returns El rectangulo agrandado y confinado.
 */
export function expandRect(rect: Rect, ratio: number, bounds: Rect): Rect {
  const growX = rect.width * ratio;
  const growY = rect.height * ratio;

  const left = Math.max(rect.x - growX, bounds.x);
  const top = Math.max(rect.y - growY, bounds.y);
  const right = Math.min(rect.x + rect.width + growX, bounds.x + bounds.width);
  const bottom = Math.min(rect.y + rect.height + growY, bounds.y + bounds.height);

  return { x: left, y: top, width: right - left, height: bottom - top };
}

/**
 * Indica si el cuadrilatero es convexo y esta bien orientado.
 *
 * Importa porque una esquina arrastrada mas alla de su vecina cruza dos lados y
 * convierte el cuadrilatero en una corbata de lazo. La homografia de un
 * cuadrilatero cruzado sigue existiendo, pero pliega la imagen sobre si misma y
 * la previsualizacion se vuelve ilegible. Detectarlo permite avisar en lugar de
 * dibujar basura.
 *
 * Se comprueba que los cuatro productos vectoriales de lados consecutivos
 * tengan el mismo signo. Un producto nulo significa tres esquinas alineadas: el
 * cuadrilatero degenera en triangulo y tampoco sirve.
 *
 * @param quad Cuadrilatero a comprobar.
 * @returns Cierto si es convexo y no degenerado.
 */
export function isConvexQuad(quad: Quad): boolean {
  // Se marca como worklet para poder evaluarla tambien en el hilo de UI, que es
  // donde se arrastran las esquinas: detectar el cruce alli evita mandar cuatro
  // puntos al hilo de JavaScript en cada fotograma del gesto. La directiva es
  // una cadena, no un import, asi que el modulo sigue siendo puro y se sigue
  // probando en Node como cualquier otra funcion.
  'worklet';

  // Los productos vectoriales van escritos aqui dentro y no en una funcion
  // auxiliar: un worklet no puede llamar a otra funcion del modulo, porque el
  // complemento de compilacion no la arrastra consigo al hilo de UI. Se paga en
  // legibilidad y se gana no tener dos implementaciones de la misma geometria,
  // una probada y otra no.
  const [p0, p1, p2, p3] = quad;
  const crosses = [
    (p1.x - p0.x) * (p2.y - p1.y) - (p1.y - p0.y) * (p2.x - p1.x),
    (p2.x - p1.x) * (p3.y - p2.y) - (p2.y - p1.y) * (p3.x - p2.x),
    (p3.x - p2.x) * (p0.y - p3.y) - (p3.y - p2.y) * (p0.x - p3.x),
    (p0.x - p3.x) * (p1.y - p0.y) - (p0.y - p3.y) * (p1.x - p0.x),
  ];

  let sign = 0;
  for (const cross of crosses) {
    if (cross === 0) {
      return false;
    }

    const currentSign = cross > 0 ? 1 : -1;
    if (sign === 0) {
      sign = currentSign;
    } else if (sign !== currentSign) {
      return false;
    }
  }

  return true;
}

/**
 * Traslada un cuadrilatero al origen de un rectangulo.
 *
 * Las esquinas se eligen sobre la imagen completa, pero se envian junto al
 * recorte, asi que hay que expresarlas en coordenadas del recorte. Sin esta
 * traslacion el servidor recibiria esquinas que caen fuera de la imagen que le
 * llega.
 *
 * @param quad Cuadrilatero en coordenadas de la imagen completa.
 * @param origin Rectangulo recortado, cuyo vertice superior izquierdo es el nuevo origen.
 * @returns El cuadrilatero en coordenadas del recorte.
 */
export function translateQuadToOrigin(quad: Quad, origin: Rect): Quad {
  return mapQuad(quad, (point) => ({ x: point.x - origin.x, y: point.y - origin.y }));
}

/**
 * Reescala un cuadrilatero entre dos sistemas de coordenadas.
 *
 * Las esquinas se manipulan en puntos de pantalla y se envian en pixeles de la
 * imagen. Ambos espacios comparten proporcion pero no escala.
 *
 * @param quad Cuadrilatero de partida.
 * @param factor Factor de escala a aplicar a ambos ejes.
 * @returns El cuadrilatero reescalado.
 */
export function scaleQuad(quad: Quad, factor: number): Quad {
  return mapQuad(quad, (point) => ({ x: point.x * factor, y: point.y * factor }));
}

/**
 * Aplica una transformacion a las cuatro esquinas conservando el tipo tupla.
 *
 * Array.map devolveria Point[], que pierde la garantia de que hay exactamente
 * cuatro esquinas. Esa garantia es la que permite a la homografia destructurar
 * sin comprobar longitudes.
 *
 * @param quad Cuadrilatero de partida.
 * @param transform Transformacion a aplicar a cada esquina.
 * @returns El cuadrilatero transformado.
 */
export function mapQuad(quad: Quad, transform: (point: Point) => Point): Quad {
  const [p0, p1, p2, p3] = quad;
  return [transform(p0), transform(p1), transform(p2), transform(p3)];
}
