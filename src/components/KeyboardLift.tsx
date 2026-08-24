import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

import { keyboardBehavior } from '@/shell/keyboard';

interface KeyboardLiftProps {
  readonly children: ReactNode;
}

/**
 * El ajuste se resuelve una vez, a nivel de modulo: `Platform.OS` no cambia
 * durante la ejecucion, y calcularlo por render seria trabajo por nada.
 */
const BEHAVIOR = keyboardBehavior(Platform.OS);

/**
 * Aparta su contenido del teclado.
 *
 * Envuelve a las tres pantallas que tienen campos de texto dentro de un area
 * desplazable. Sin esto, en iOS el teclado tapa justo lo que hay al pie: el
 * campo del identificador y el boton de enviar de la confirmacion, y el campo de
 * anotaciones del detalle.
 *
 * La regla de que ajuste toca vive en `keyboard.ts`, que es puro y esta
 * probado, porque es el tipo de decision que se escribe una vez y se copia mal
 * cuatro veces.
 *
 * @param children Contenido a apartar.
 * @returns El contenido, ya consciente del teclado.
 */
export function KeyboardLift({ children }: KeyboardLiftProps) {
  return (
    <KeyboardAvoidingView style={styles.fill} behavior={BEHAVIOR}>
      {children}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
