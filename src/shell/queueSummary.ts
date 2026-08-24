/**
 * Que dicen el inicio y el historial sobre la cola de subida.
 *
 * Modulo puro. Existe para que el estado «todavia no se sabe» sea imposible de
 * olvidar: las tres funciones piden la hidratacion como primer argumento, asi
 * que no se puede calcular que poner en pantalla sin haber decidido antes que
 * se pone mientras se lee el disco.
 *
 * Ese olvido tenia consecuencias visibles. La cola se rehidrata de forma
 * asincrona, y en los primeros fotogramas el historial invitaba a capturar
 * —«aqui apareceran»— y el inicio decia «Todavia ninguno» aunque hubiera cuatro
 * estudios guardados.
 */

import { HOME_TEXT } from '@/constants/shellText';

/** Que ensena el historial. */
export type HistoryView = 'loading' | 'empty' | 'list';

/**
 * Decide que ensena el historial.
 *
 * MIENTRAS SE LEE EL DISCO NO SE ENSENA NADA, ni un indicador de carga. Es una
 * lectura de AsyncStorage, o sea unos milisegundos: un indicador que aparece y
 * desaparece en ese tiempo es un parpadeo mas, no una explicacion. El lienzo
 * vacio no afirma nada, que es exactamente lo que corresponde cuando no se sabe.
 *
 * @param hasHydrated Cierto si la cola ya se leyo del disco.
 * @param count Estudios guardados.
 * @returns Que ensena la pantalla.
 */
export function historyView(hasHydrated: boolean, count: number): HistoryView {
  if (!hasHydrated) {
    return 'loading';
  }

  return count === 0 ? 'empty' : 'list';
}

/**
 * Cuantos estudios esperan a subirse.
 *
 * Se cuenta en palabras y no con un numero suelto porque el modulo tiene que
 * poder leerse de un vistazo: "1 estudio esperando" se entiende sin mirar el
 * titulo del modulo, "1" no.
 *
 * @param hasHydrated Cierto si la cola ya se leyo del disco.
 * @param count Estudios sin subir.
 * @returns La linea del modulo, o nada si todavia no se sabe.
 */
export function describePending(hasHydrated: boolean, count: number): string | undefined {
  if (!hasHydrated) {
    return undefined;
  }

  if (count === 0) {
    return HOME_TEXT.pendingEmpty;
  }

  return count === 1 ? HOME_TEXT.pendingOne : `${count} ${HOME_TEXT.pendingMany}`;
}

/**
 * Cuantos estudios hay guardados.
 *
 * @param hasHydrated Cierto si la cola ya se leyo del disco.
 * @param count Estudios en la cola, enviados o no.
 * @returns La linea del modulo, o nada si todavia no se sabe.
 */
export function describeSaved(hasHydrated: boolean, count: number): string | undefined {
  if (!hasHydrated) {
    return undefined;
  }

  if (count === 0) {
    return HOME_TEXT.recentEmpty;
  }

  return count === 1 ? HOME_TEXT.recentOne : `${count} ${HOME_TEXT.recentMany}`;
}
