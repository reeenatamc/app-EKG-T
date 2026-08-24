/**
 * Cuanto se hunde un control al tocarlo.
 *
 * Modulo puro. La escala es un numero y la regla de movimiento reducido es una
 * condicion; ninguna de las dos necesita React, y escritas aparte se pueden
 * fijar con pruebas en vez de a ojo sobre un dispositivo.
 */

/**
 * Escala del control pulsado.
 *
 * Tres centesimas. Es poco a proposito: lo que se busca es que el control acuse
 * el dedo, no que se mueva. Por encima de un 5 % un boton ancho parece que se
 * aleja, y en una fila de lista arrastra la mirada a un sitio donde no pasa
 * nada.
 */
export const PRESSED_SCALE = 0.97;

/**
 * Devuelve la escala que le toca a un control.
 *
 * CON MOVIMIENTO REDUCIDO NO SE ENCOGE, y no es que se encoja mas rapido: §11
 * pide saltar al estado final, y el estado final de un control pulsado es su
 * tamano normal. Una escala instantanea seria un parpadeo de tamano, que es
 * justo lo que molesta a quien pide menos movimiento.
 *
 * @param isPressed Cierto mientras el dedo esta encima.
 * @param reduceMotion Cierto si hay que renunciar al movimiento.
 * @returns La escala destino.
 */
export function targetScale(isPressed: boolean, reduceMotion: boolean): number {
  if (reduceMotion || !isPressed) {
    return 1;
  }

  return PRESSED_SCALE;
}
