/**
 * Como se aparta la interfaz del teclado, por plataforma.
 *
 * Modulo puro para poder fijar la regla con sus dos casos escritos. No es una
 * preferencia: las dos plataformas resuelven el teclado de forma distinta y
 * aplicar el mismo ajuste a las dos rompe una de ellas.
 */

/** Ajuste que necesita `KeyboardAvoidingView`. */
export type KeyboardBehavior = 'padding' | undefined;

/**
 * Decide el ajuste que hace falta.
 *
 * EN ANDROID NO HACE FALTA NINGUNO. Expo deja `softwareKeyboardLayoutMode` en
 * «resize», o sea que el sistema encoge la ventana entera al abrir el teclado y
 * el diseno se recoloca solo. Anadir ahi un relleno propio lo aparta **dos
 * veces**: el contenido sube el doble de lo que mide el teclado y la mitad
 * inferior de la pantalla queda en blanco.
 *
 * EN iOS EL TECLADO SE SUPERPONE y nadie encoge nada, asi que sin relleno tapa
 * lo que hay debajo. Ahi es donde estan el boton de enviar y el campo del
 * identificador.
 *
 * @param os Sistema operativo, tal y como lo da `Platform.OS`.
 * @returns El ajuste, o nada si la plataforma ya se encarga.
 */
export function keyboardBehavior(os: string): KeyboardBehavior {
  return os === 'ios' ? 'padding' : undefined;
}
