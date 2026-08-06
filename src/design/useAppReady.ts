import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { useAppFonts } from '@/design/type';
import { useSettingsHydrated } from '@/state/settings';

// El splash se retiene desde el ambito de modulo, antes del primer render.
void SplashScreen.preventAutoHideAsync();

/**
 * Indica si la aplicacion puede pintar su primer fotograma.
 *
 * Espera dos cosas, y ninguna es opcional:
 *
 * - **Las fuentes.** Sin ellas se veria el salto tipografico que §6 prohibe.
 * - **Las preferencias.** Se leen de disco de forma asincrona, asi que sin
 *   esperarlas la aplicacion pintaria un fotograma con el tema por defecto
 *   antes de saber cual quiere el usuario. En un dispositivo con tema oscuro
 *   eso es un destello blanco perfectamente visible.
 *
 * Retener el splash unos milisegundos mas es preferible a ese destello.
 *
 * @returns Cierto cuando la interfaz puede renderizarse.
 */
export function useAppReady(): boolean {
  const areFontsReady = useAppFonts();
  const areSettingsHydrated = useSettingsHydrated();
  const isReady = areFontsReady && areSettingsHydrated;

  useEffect(() => {
    if (isReady) {
      void SplashScreen.hideAsync();
    }
  }, [isReady]);

  return isReady;
}
