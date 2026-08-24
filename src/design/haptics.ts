import * as Haptics from 'expo-haptics';

import { useSettings } from '@/state/settings';

/**
 * Vocabulario tactil de la aplicacion.
 *
 * CUATRO Y NO MAS, y son los cuatro momentos en que el dedo necesita saber que
 * algo ocurrio sin mirar la pantalla:
 *
 * - `selection`: se cambio de pestana, de montaje o de opcion. Es el mas suave
 *   que existe, porque acompana a algo que ademas se ve.
 * - `shutter`: se tomo la foto. Es el unico impacto, y es firme a proposito: el
 *   obturador se pulsa mirando el papel, no la pantalla, y ahi el golpe tactil
 *   es la unica confirmacion que llega.
 * - `success` y `failure`: el estudio se encolo, o algo no salio.
 *
 * NO HAY VIBRACION POR PULSAR UN BOTON CUALQUIERA. Un telefono que vibra en cada
 * toque deja de decir nada: la respuesta tactil solo informa mientras sea rara.
 */
export type HapticEvent = 'selection' | 'shutter' | 'success' | 'failure';

/**
 * Da la respuesta tactil de un evento, si el usuario la quiere.
 *
 * Lee el ajuste con `getState()` y no con un gancho porque esto se llama desde
 * manejadores de evento, nunca durante un renderizado: suscribirse obligaria a
 * volver a renderizar media aplicacion cada vez que alguien toca el interruptor.
 *
 * No devuelve promesa: quien pulsa un boton no espera a que acabe la vibracion,
 * y encadenar la accion a ella la retrasaria sin ganar nada.
 *
 * @param event Momento que se quiere confirmar.
 */
export function playHaptic(event: HapticEvent): void {
  if (!useSettings.getState().haptics) {
    return;
  }

  void perform(event).catch((error: unknown) => {
    // Degradacion, no fallo: hay dispositivos sin motor de vibracion y
    // emuladores que no lo simulan. Nada de lo que el usuario pidio deja de
    // ocurrir por esto, asi que se registra y no se le cuenta a nadie.
    console.warn('[haptics] el dispositivo no dio respuesta tactil', { event, error });
  });
}

/**
 * Traduce un evento al patron nativo que le corresponde.
 *
 * @param event Momento a confirmar.
 * @returns La promesa del modulo nativo.
 */
function perform(event: HapticEvent): Promise<void> {
  switch (event) {
    case 'selection':
      return Haptics.selectionAsync();
    case 'shutter':
      return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    case 'success':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    case 'failure':
      return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
}
