/**
 * Cuartos de vuelta: como esta girado el telefono y como sale girada la foto.
 *
 * Modulo puro, por lo mismo que framing.ts y tilt.ts: aqui hay un convenio de
 * ejes y cuatro casos que conviene poder comprobar sin sujetar un telefono.
 *
 * POR QUE EXISTE. La aplicacion esta bloqueada en vertical, pero la camara no:
 * en Android, expo-camera escucha la orientacion fisica con un
 * `OrientationEventListener` y gira la foto para que salga derecha respecto a la
 * gravedad. Con el telefono en horizontal la foto sale apaisada mientras la
 * vista previa sigue en vertical, y el recorte, calculado sobre la vista previa,
 * caia en otro sitio de la foto. Por eso habia que fotografiar en vertical un
 * registro que es horizontal.
 *
 * Para casar las dos cosas sin recompilar la parte nativa, este modulo repite en
 * JavaScript la misma decision que toma Android, con la misma formula y los
 * mismos cortes.
 */

import type { GravityVector } from '@/camera/tilt';
import type { Rect, Size } from '@/camera/framing';

/**
 * Giro del telefono, en grados, con el valor de `Surface.ROTATION_*` de Android.
 *
 * - `0`: de pie, como se sostiene normalmente.
 * - `90`: en horizontal con el lado derecho arriba (la parte de arriba del
 *   telefono a la izquierda). Es el apaisado mas habitual.
 * - `180`: boca abajo.
 * - `270`: en horizontal con el lado izquierdo arriba.
 */
export type QuarterTurn = 0 | 90 | 180 | 270;

const RADIANS_TO_DEGREES = 180 / Math.PI;

/**
 * Deduce el giro del telefono a partir de la gravedad.
 *
 * ES LA FORMULA DE `OrientationEventListener`, no una parecida. Android calcula
 * `90 - atan2(-Y, X)` en grados con los ejes del acelerometro cambiados de signo,
 * y expo-sensors entrega `accelerationIncludingGravity` ya con ese signo (resta
 * dos veces la gravedad a la lectura en crudo). Los cortes a 45, 135, 225 y 315
 * grados son los que usa expo-camera para elegir la rotacion de la foto.
 *
 * CON EL TELEFONO PLANO NO SE SABE, y se conserva el giro anterior, igual que
 * hace Android: si la gravedad casi no tiene componente en el plano de la
 * pantalla (menos de la mitad de la perpendicular), cualquier angulo es ruido.
 * Es lo que pasa al fotografiar un papel sobre la mesa, y por eso importa: el
 * giro que vale es el que tenia el telefono al bajarlo.
 *
 * @param gravity Aceleracion con gravedad, tal como la da expo-sensors.
 * @param previous Giro anterior, que se conserva si ahora no se puede saber.
 * @returns El giro del telefono.
 */
export function turnFromGravity(gravity: GravityVector, previous: QuarterTurn): QuarterTurn {
  const inPlane = gravity.x * gravity.x + gravity.y * gravity.y;

  if (inPlane * 4 < gravity.z * gravity.z || inPlane === 0) {
    return previous;
  }

  const angle = Math.round(Math.atan2(-gravity.y, gravity.x) * RADIANS_TO_DEGREES);
  const orientation = (((90 - angle) % 360) + 360) % 360;

  if (orientation >= 45 && orientation < 135) {
    return 270;
  }
  if (orientation >= 135 && orientation < 225) {
    return 180;
  }
  if (orientation >= 225 && orientation < 315) {
    return 90;
  }
  return 0;
}

/**
 * Cierto si el giro pone el telefono en horizontal.
 *
 * @param turn Giro del telefono.
 * @returns Cierto en 90 y 270.
 */
export function isSideways(turn: QuarterTurn): boolean {
  return turn === 90 || turn === 270;
}

/**
 * Tamano de algo tras girarlo.
 *
 * @param size Tamano original.
 * @param turn Giro aplicado.
 * @returns El tamano girado: ancho y alto se cambian en los cuartos impares.
 */
export function turnSize(size: Size, turn: QuarterTurn): Size {
  return isSideways(turn) ? { width: size.height, height: size.width } : size;
}

/**
 * Lleva un rectangulo de una imagen a la misma imagen girada en sentido
 * contrario a las agujas del reloj.
 *
 * Es el sentido en que Android gira la foto respecto a la vista previa: con el
 * lado derecho arriba (`90`), lo que en la vista previa esta a la derecha queda
 * arriba en la foto.
 *
 * @param rect Rectangulo, en coordenadas de la imagen sin girar.
 * @param image Tamano de la imagen sin girar.
 * @param turn Cuanto se gira la imagen, en sentido antihorario.
 * @returns El rectangulo en coordenadas de la imagen girada.
 */
export function turnRectCounterClockwise(rect: Rect, image: Size, turn: QuarterTurn): Rect {
  switch (turn) {
    case 90:
      return {
        x: rect.y,
        y: image.width - rect.x - rect.width,
        width: rect.height,
        height: rect.width,
      };
    case 180:
      return {
        x: image.width - rect.x - rect.width,
        y: image.height - rect.y - rect.height,
        width: rect.width,
        height: rect.height,
      };
    case 270:
      return {
        x: image.height - rect.y - rect.height,
        y: rect.x,
        width: rect.height,
        height: rect.width,
      };
    default:
      return rect;
  }
}

/**
 * Cuanto giro le aplico de verdad Android a la foto.
 *
 * NO SE DA POR HECHO QUE COINCIDA CON EL DE LA PANTALLA. Los dos leen el mismo
 * sensor con la misma formula, pero no en el mismo instante, y expo-camera crea
 * de nuevo el caso de captura al cambiar el tamano de foto: un caso recien
 * creado nace en `0` y no se entera del giro hasta que el telefono se mueve.
 * La forma de la foto no miente: un sensor de telefono es apaisado, y la foto
 * solo sale apaisada si Android la giro un cuarto impar.
 *
 * Si la forma contradice al giro esperado, manda la forma. Entre los dos cuartos
 * que encajan con ella se elige el mas probable (el apaisado habitual, o de pie).
 *
 * @param expected Giro que leia la pantalla al disparar.
 * @param photo Tamano de la foto entregada.
 * @returns El giro que tiene la foto respecto a la vista previa.
 */
export function appliedTurn(expected: QuarterTurn, photo: Size): QuarterTurn {
  const photoIsSideways = photo.width > photo.height;

  if (photoIsSideways === isSideways(expected)) {
    return expected;
  }

  return photoIsSideways ? 90 : 0;
}

/**
 * Cuanto hay que girar todavia la foto, en sentido horario, para que quede
 * derecha respecto a como se sostenia el telefono.
 *
 * Cero en el caso normal, en que Android ya la giro. Distinto de cero solo cuando
 * `appliedTurn` tuvo que corregir: la foto se quedo como la vista previa y el
 * registro sale de lado.
 *
 * @param applied Giro que tiene la foto.
 * @param expected Giro del telefono al disparar.
 * @returns Grados en sentido horario, como los espera expo-image-manipulator.
 */
export function remainingClockwise(applied: QuarterTurn, expected: QuarterTurn): QuarterTurn {
  return ((((applied - expected) % 360) + 360) % 360) as QuarterTurn;
}
