/**
 * Como sale una pantalla apilada.
 *
 * Modulo puro: decidir si se puede retroceder o hay que caer a una ruta fija no
 * necesita React ni el router, solo la respuesta a una pregunta.
 *
 * POR QUE NO BASTA CON `router.back()`. La aplicacion declara un esquema propio
 * y depende de expo-linking, o sea que se puede entrar directamente a
 * `/study/<id>` o a `/settings` desde fuera. En ese arranque la pila tiene un
 * solo elemento: `back()` no hace nada y la pantalla se queda sin salida, que es
 * exactamente el fallo que este modulo existe para evitar. Con la pila normal
 * —se llego navegando— retroceder es lo correcto, porque conserva el sitio del
 * que se venia.
 */

/** Lo que hay que hacer para salir de una pantalla. */
export type BackIntent =
  { readonly kind: 'back' } | { readonly kind: 'replace'; readonly route: string };

/**
 * Decide como sale una pantalla apilada.
 *
 * Se reemplaza en lugar de apilar: la pantalla de la que se sale no debe quedar
 * detras de la de destino, o volver a retroceder devolveria a ella y el usuario
 * daria vueltas entre dos pantallas.
 *
 * @param canGoBack Cierto si hay algo debajo en la pila de navegacion.
 * @param fallback Ruta a la que caer cuando no lo hay.
 * @returns La intencion de salida.
 */
export function resolveBack(canGoBack: boolean, fallback: string): BackIntent {
  return canGoBack ? { kind: 'back' } : { kind: 'replace', route: fallback };
}
