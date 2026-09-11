/**
 * Que dicen el inicio y el historial sobre la cola de subida.
 *
 * Modulo puro. Existe para que el estado «todavia no se sabe» sea imposible de
 * olvidar: la funcion pide la hidratacion como primer argumento, asi
 * que no se puede calcular que poner en pantalla sin haber decidido antes que
 * se pone mientras se lee el disco.
 *
 * Ese olvido tenia consecuencias visibles. La cola se rehidrata de forma
 * asincrona, y en los primeros fotogramas el historial invitaba a capturar
 * —«aqui apareceran»— y el inicio decia «Todavia ninguno» aunque hubiera cuatro
 * estudios guardados.
 */

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
