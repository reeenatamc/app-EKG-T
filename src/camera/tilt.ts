/**
 * Matematica de la inclinacion.
 *
 * Modulo puro, separado del gancho que lo usa, por el mismo motivo que
 * framing.ts: aqui hay un convenio de signos y una normalizacion que conviene
 * poder verificar sin sujetar un telefono en la mano.
 */

/** Vector de aceleracion con gravedad incluida, tal y como lo entrega el sensor. */
export interface GravityVector {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

/**
 * Como esta apoyado el papel que se fotografia.
 *
 * `flat` es el papel sobre una mesa, una camilla o un carro, con el telefono
 * boca abajo encima. `upright` es el papel en vertical —pegado a un negatoscopio,
 * a la pared, o sujetado por otra persona— con el telefono de pie enfrente.
 *
 * NO SE ELIGE A MANO. Un selector mas en una pantalla que ya tiene guia de
 * encuadre, montaje y nivel seria un control que hay que acertar antes de poder
 * usar el instrumento, y quien fotografia ya tiene el telefono en la postura
 * correcta cuando mira el nivel. Se deduce de la propia gravedad.
 */
export type TiltMode = 'flat' | 'upright';

export interface TiltReading {
  /**
   * Desviacion respecto a lo ideal del modo, en grados. Cero es correcto.
   *
   * En `flat` es cuanto se aparta de la horizontal; en `upright`, cuanto se
   * aparta de la vertical. Al medir siempre contra el ideal del modo activo, el
   * umbral de alineado de `useTilt` vale igual para los dos y no hay que
   * duplicarlo.
   */
  readonly degrees: number;
  /** Direccion de la inclinacion en el plano de la pantalla, entre -1 y 1. */
  readonly x: number;
  readonly y: number;
  /** Postura deducida de la gravedad. */
  readonly mode: TiltMode;
}

const RADIANS_TO_DEGREES = 180 / Math.PI;

/**
 * Grados desde la horizontal a partir de los cuales se pasa a papel vertical.
 *
 * El corte natural son 45, pero un umbral unico haria que el nivel cambiara de
 * pregunta varias veces por segundo con el telefono a media altura, y el punto
 * daria saltos sin que la mano se hubiera movido. Con la banda muerta entre 35 y
 * 55 hay que decidirse a cambiar de postura para que el instrumento cambie.
 */
const UPRIGHT_ENTER_DEGREES = 55;

/** Grados desde la horizontal por debajo de los cuales se vuelve a papel en mesa. */
const FLAT_ENTER_DEGREES = 35;

/**
 * Signo del desplazamiento del punto del nivel.
 *
 * Un nivel de burbuja mueve la burbuja hacia el lado alto, no hacia el bajo, y
 * la gravedad apunta al bajo: de ahi el signo negativo. Es el unico valor de
 * este modulo que depende del convenio de ejes del fabricante, asi que se
 * comprueba en dispositivo inclinando el telefono y viendo hacia donde va el
 * punto.
 */
const BUBBLE_DIRECTION = -1;

/**
 * Peso de cada lectura nueva en el filtro. Bajo suaviza mas y responde menos.
 */
export const SMOOTHING = 0.2;

/**
 * Traduce el vector de gravedad a inclinacion y direccion.
 *
 * NO SE USAN rotation.beta NI rotation.gamma. expo-sensors no documenta las
 * unidades de rotation, y equivocarse entre grados y radianes da un error de un
 * factor de 57 que ademas pasa desapercibido en el emulador. El angulo sale de
 * normalizar el vector, asi que no depende ni de la unidad ni del convenio de
 * signo del fabricante.
 *
 * Se toma el valor absoluto de z porque da igual si la camara mira hacia arriba
 * o hacia abajo: lo que se pregunta es si el plano de la imagen es paralelo al
 * del papel.
 *
 * DOS POSTURAS, LA MISMA PREGUNTA. El nivel siempre pregunta si el plano de la
 * imagen es paralelo al del papel; lo que cambia con la postura es donde tiene
 * que estar la gravedad para que eso se cumpla. Con el papel en una mesa la
 * gravedad debe salir perpendicular a la pantalla, o sea toda en z, y lo que
 * sobra son las componentes x e y. Con el papel en vertical es al reves: la
 * gravedad debe quedar DENTRO del plano de la pantalla, y lo que sobra es z.
 *
 * De ahi salen las dos formulas, que son la misma vista desde los dos lados:
 * `acos(|z|)` mide cuanto se aparta de la mesa y `asin(|z|)` cuanto se aparta de
 * la vertical.
 *
 * @param gravity Vector de aceleracion con gravedad.
 * @param previous Postura de la lectura anterior, para la banda muerta.
 * @returns La lectura, o null si el vector es nulo y no define direccion.
 */
export function measureTilt(
  gravity: GravityVector,
  previous: TiltMode = 'flat',
): TiltReading | null {
  const magnitude = Math.hypot(gravity.x, gravity.y, gravity.z);
  if (magnitude === 0) {
    return null;
  }

  const normal = Math.min(Math.abs(gravity.z) / magnitude, 1);
  const fromFlat = Math.acos(normal) * RADIANS_TO_DEGREES;
  const mode = resolveMode(fromFlat, previous);

  if (mode === 'flat') {
    return {
      degrees: fromFlat,
      x: (BUBBLE_DIRECTION * gravity.x) / magnitude,
      y: (BUBBLE_DIRECTION * gravity.y) / magnitude,
      mode,
    };
  }

  return { degrees: 90 - fromFlat, ...uprightOffset(gravity, magnitude), mode };
}

/**
 * Elige postura con banda muerta.
 *
 * @param fromFlat Grados que separan al telefono de la horizontal.
 * @param previous Postura anterior.
 * @returns La postura vigente.
 */
function resolveMode(fromFlat: number, previous: TiltMode): TiltMode {
  if (previous === 'flat') {
    return fromFlat > UPRIGHT_ENTER_DEGREES ? 'upright' : 'flat';
  }
  return fromFlat < FLAT_ENTER_DEGREES ? 'flat' : 'upright';
}

/**
 * Desplazamiento del punto con el papel en vertical.
 *
 * AQUI EL ERROR SALE DE LA PANTALLA, y por eso hay que proyectarlo. Lo que
 * sobra es z, que es perpendicular a la pantalla y no tiene sitio propio en un
 * indicador plano. Se dibuja a lo largo de la direccion que la gravedad marca
 * DENTRO de la pantalla, que es exactamente el eje sobre el que se corrige: si
 * el telefono esta de pie en vertical, ese eje va de arriba abajo; si esta
 * tumbado en apaisado, va de lado a lado. Asi el punto se mueve por donde la
 * muneca gira, en las dos orientaciones y sin preguntarle nada al sistema.
 *
 * EL SIGNO NO LLEVA `BUBBLE_DIRECTION`, y es deliberado. Con el papel en mesa el
 * punto sube al lado alto, que es lo que hace una burbuja de verdad. Aqui no hay
 * lado alto —el telefono esta de pie, arriba es arriba— y lo util es que el
 * punto marque el borde que se esta yendo hacia atras, para traerlo. Son dos
 * convenios distintos porque son dos preguntas distintas.
 *
 * @param gravity Vector de aceleracion con gravedad.
 * @param magnitude Modulo del vector, ya calculado.
 * @returns Las dos componentes del punto.
 */
function uprightOffset(gravity: GravityVector, magnitude: number): { x: number; y: number } {
  const inPlane = Math.hypot(gravity.x, gravity.y);
  if (inPlane === 0) {
    return { x: 0, y: 0 };
  }

  const stray = gravity.z / magnitude;
  return { x: (gravity.x / inPlane) * stray, y: (gravity.y / inPlane) * stray };
}

/**
 * Mezcla una lectura nueva con la anterior mediante un filtro paso bajo.
 *
 * Sin filtrar, el pulso de la mano hace vibrar el indicador varias veces por
 * segundo y el estado de alineado parpadea. Suavizar cuesta un poco de
 * respuesta y compra una lectura que se puede mirar.
 *
 * @param previous Lectura suavizada anterior, o null en la primera.
 * @param reading Lectura recien llegada del sensor.
 * @returns La lectura suavizada.
 */
export function smoothTilt(previous: TiltReading | null, reading: TiltReading): TiltReading {
  // Al cambiar de postura se adopta la lectura nueva de golpe. Interpolar entre
  // dos posturas mezclaria dos preguntas distintas: el punto haria un barrido de
  // un par de segundos por posiciones que no significan nada, justo mientras el
  // usuario mira si esta alineado.
  if (previous === null || previous.mode !== reading.mode) {
    return reading;
  }

  return {
    degrees: previous.degrees + SMOOTHING * (reading.degrees - previous.degrees),
    x: previous.x + SMOOTHING * (reading.x - previous.x),
    y: previous.y + SMOOTHING * (reading.y - previous.y),
    mode: reading.mode,
  };
}
