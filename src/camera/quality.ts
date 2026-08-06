/**
 * Control de calidad de la foto antes de subirla.
 *
 * Modulo puro: recibe una imagen en escala de grises ya reducida y devuelve
 * hallazgos, no textos. Los textos viven en constants/qualityText.ts, igual que
 * los de autenticacion, para que la redaccion se pueda revisar sin tocar las
 * heuristicas y para que estas se puedan probar sin leer cadenas.
 *
 * Advierte, nunca bloquea. El usuario puede estar en una guardia con la luz que
 * hay y la unica foto que va a conseguir; una aplicacion que se niega a subirla
 * no protege a nadie, solo se quita de en medio. Lo que si hace es explicar por
 * que importa, porque una advertencia que no se entiende se ignora dos veces:
 * la primera por incomoda y la segunda por costumbre.
 */

import { NOMINAL_TRACE_WIDTH_MM } from '@/camera/mounts';

export type QualityIssue = 'low-resolution' | 'blurry' | 'glare' | 'underexposed';

export interface QualityFinding {
  readonly issue: QualityIssue;
  /** Valor medido, en las unidades del umbral. Permite mostrar el dato, no solo el veredicto. */
  readonly measured: number;
  readonly threshold: number;
}

export interface QualityInput {
  /** Luminancia por pixel, de 0 a 255, de la copia reducida. */
  readonly gray: Uint8Array;
  /** Dimensiones de la copia reducida. */
  readonly width: number;
  readonly height: number;
  /** Ancho en pixeles del recorte a tamano real, que es el que se envia. */
  readonly capturedWidthPx: number;
}

/**
 * Ancho al que se reduce la imagen para analizarla.
 *
 * Las tres heuristicas dependen de la escala: la varianza del laplaciano de una
 * misma foto cambia si se mide a 512 o a 4000 pixeles de ancho. Analizar
 * siempre al mismo ancho es lo que permite que los umbrales signifiquen lo
 * mismo en cualquier telefono, con cualquier sensor.
 */
export const ANALYSIS_WIDTH_PX = 512;

/**
 * Minimo de pixeles por milimetro de papel.
 *
 * PROVISIONAL. Este valor se sustituye por una medicion, no por otra deduccion.
 *
 * De donde sale mientras tanto: el trazo de un electrocardiografo mide unos
 * 0,4 mm de ancho, y para que una linea sobreviva al muestreo hacen falta unos
 * tres pixeles a lo ancho. 3 / 0,4 da 7,5, redondeado a 8.
 *
 * Por que no basta con eso: el umbral no depende solo del papel, sino tambien
 * de la escala a la que se entreno el modelo de digitalizacion. Es el numero
 * que separa el 26% de recuperacion de senal del 99%, asi que estimarlo a ojo
 * es justo lo que no conviene.
 *
 * Como se sustituye: la etapa de calibracion del propio digitalizador deduce el
 * espaciado de la retícula por autocorrelacion y entrega mm por pixel directo
 * de la imagen. Corriendola sobre los dos casos conocidos —la imagen nativa que
 * dio 26% y la misma reescalada x3 que dio 99%— sale un intervalo empirico, y
 * el umbral se fija dentro de ese intervalo con margen.
 */
export const MIN_PIXELS_PER_MM = 8;

/**
 * Minimo de varianza del laplaciano para dar la foto por enfocada.
 *
 * Medido a ANALYSIS_WIDTH_PX. Una retícula de electrocardiograma es rica en
 * bordes, asi que una foto nitida de este sujeto puntua alto; por debajo de
 * este valor lo que hay es un borron.
 */
export const MIN_FOCUS_VARIANCE = 120;

/** Luminancia a partir de la cual un pixel se considera quemado. */
const GLARE_LEVEL = 250;

/**
 * Fraccion maxima de pixeles quemados.
 *
 * El papel de electrocardiograma es claro pero no llega a quemarse: bajo luz
 * normal se queda entre 200 y 235. Un pixel en 250 o mas es casi siempre un
 * reflejo especular, el brillo de la luz del techo sobre la funda de plastico o
 * sobre el satinado del papel. Ahi debajo no hay retícula que recuperar.
 */
const MAX_GLARE_FRACTION = 0.02;

/** Luminancia media minima. Por debajo, el ruido del sensor se come el trazo. */
const MIN_MEAN_LUMINANCE = 60;

/**
 * Pixeles por milimetro que alcanza un recorte.
 *
 * @param capturedWidthPx Ancho del recorte en pixeles.
 * @returns La resolucion efectiva sobre el papel.
 */
export function pixelsPerMillimetre(capturedWidthPx: number): number {
  return capturedWidthPx / NOMINAL_TRACE_WIDTH_MM;
}

/**
 * Varianza del laplaciano, usada como medida de enfoque.
 *
 * El laplaciano responde a los cambios bruscos de luminancia, que es lo que un
 * borde es. Una foto movida los suaviza todos, asi que su varianza se desploma.
 * Se recorren solo los pixeles interiores para no tener que inventar valores
 * fuera del borde.
 *
 * @param gray Luminancia por pixel.
 * @param width Ancho de la imagen analizada.
 * @param height Alto de la imagen analizada.
 * @returns La varianza, o 0 si la imagen es demasiado pequena para tener interior.
 */
export function focusVariance(gray: Uint8Array, width: number, height: number): number {
  if (width < 3 || height < 3) {
    return 0;
  }

  let sum = 0;
  let sumOfSquares = 0;
  let count = 0;

  // El recorrido se queda en el interior, asi que los cinco indices caen dentro
  // del arreglo por construccion. El respaldo a cero esta solo porque el
  // compilador no puede demostrarlo con indices calculados.
  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const index = y * width + x;
      const laplacian =
        4 * (gray[index] ?? 0) -
        (gray[index - 1] ?? 0) -
        (gray[index + 1] ?? 0) -
        (gray[index - width] ?? 0) -
        (gray[index + width] ?? 0);

      sum += laplacian;
      sumOfSquares += laplacian * laplacian;
      count += 1;
    }
  }

  const mean = sum / count;
  return sumOfSquares / count - mean * mean;
}

/**
 * Fraccion de pixeles quemados por reflejo.
 *
 * @param gray Luminancia por pixel.
 * @returns Fraccion entre 0 y 1.
 */
export function glareFraction(gray: Uint8Array): number {
  if (gray.length === 0) {
    return 0;
  }

  let burned = 0;
  for (const value of gray) {
    if (value >= GLARE_LEVEL) {
      burned += 1;
    }
  }

  return burned / gray.length;
}

/**
 * Luminancia media de la imagen.
 *
 * @param gray Luminancia por pixel.
 * @returns La media, de 0 a 255.
 */
export function meanLuminance(gray: Uint8Array): number {
  if (gray.length === 0) {
    return 0;
  }

  let total = 0;
  for (const value of gray) {
    total += value;
  }

  return total / gray.length;
}

/**
 * Comprueba solo la resolucion, sin mirar los pixeles.
 *
 * Existe aparte porque es la unica comprobacion que se puede hacer siempre: se
 * deriva de las dimensiones del recorte, que se conocen sin decodificar nada.
 * Si la lectura de pixeles falla en algun dispositivo, este aviso se sigue
 * dando; callarlo por no poder medir las otras dos cosas seria ocultar el unico
 * defecto que no tiene arreglo posterior.
 *
 * @param capturedWidthPx Ancho del recorte en pixeles.
 * @returns El hallazgo, o null si la resolucion es suficiente.
 */
export function assessResolution(capturedWidthPx: number): QualityFinding | null {
  const resolution = pixelsPerMillimetre(capturedWidthPx);
  if (resolution >= MIN_PIXELS_PER_MM) {
    return null;
  }

  return { issue: 'low-resolution', measured: resolution, threshold: MIN_PIXELS_PER_MM };
}

/**
 * Evalua la foto y devuelve los problemas encontrados.
 *
 * El orden importa: se devuelven de mayor a menor efecto sobre la
 * digitalizacion, para que la interfaz pueda mostrar el primero destacado sin
 * tener que saber de heuristicas. La resolucion va primera porque es la unica
 * que no tiene arreglo posterior.
 *
 * @param input Imagen reducida y ancho del recorte real.
 * @returns Los hallazgos, en orden de gravedad. Vacio si la foto esta bien.
 */
export function assessQuality(input: QualityInput): readonly QualityFinding[] {
  const findings: QualityFinding[] = [];

  const resolution = assessResolution(input.capturedWidthPx);
  if (resolution !== null) {
    findings.push(resolution);
  }

  const focus = focusVariance(input.gray, input.width, input.height);
  if (focus < MIN_FOCUS_VARIANCE) {
    findings.push({ issue: 'blurry', measured: focus, threshold: MIN_FOCUS_VARIANCE });
  }

  const glare = glareFraction(input.gray);
  if (glare > MAX_GLARE_FRACTION) {
    findings.push({ issue: 'glare', measured: glare, threshold: MAX_GLARE_FRACTION });
  }

  const luminance = meanLuminance(input.gray);
  if (luminance < MIN_MEAN_LUMINANCE) {
    findings.push({
      issue: 'underexposed',
      measured: luminance,
      threshold: MIN_MEAN_LUMINANCE,
    });
  }

  return findings;
}
