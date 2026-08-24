import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { useStoreHydrated } from '@/state/hydration';

/**
 * Preferencias de presentacion de la aplicacion.
 *
 * DONDE VIVE CADA COSA, y por que hay dos almacenes:
 *
 * - `expo-secure-store` guarda **credenciales y decisiones de acceso**: la
 *   sesion, si la introduccion se completo y si el biometrico esta activo.
 *   Respalda en el Keystore de Android y en el Keychain de iOS.
 * - `AsyncStorage`, aqui, guarda **preferencias de presentacion**. No son
 *   secretos. Meterlas en el almacen seguro obligaria a pedirle al hardware de
 *   cifrado que descifre si el usuario prefiere el tema oscuro, y ademas
 *   retrasaria el primer render sin ninguna ganancia.
 *
 * Dos almacenes con dos propositos claros es mejor que uno solo mal usado.
 */

/**
 * Temas de la aplicacion.
 *
 * Ambos son Paper: el oscuro es Paper oscurecido, no el modo Monitor.
 */
export type ThemeMode = 'light' | 'dark';

/**
 * Estandar de color de electrodos.
 *
 * Los dos son incompatibles entre si y por eso lo elige el usuario en lugar de
 * asumirse: en AHA el brazo derecho es blanco y en IEC es rojo.
 */
export type ElectrodeStandard = 'AHA' | 'IEC';

interface SettingsState {
  /** Nulo significa seguir al sistema. */
  readonly mode: ThemeMode | null;
  readonly electrodeStandard: ElectrodeStandard;
  /**
   * Interruptor manual de transparencia reducida.
   *
   * Existe porque en Android isReduceTransparencyEnabled() siempre devuelve
   * false: sin este control, la caida a opaco no seria alcanzable alli.
   */
  readonly reduceTransparency: boolean;
  /** Interruptor manual de movimiento reducido, simetrico al anterior. */
  readonly reduceMotion: boolean;
  readonly setMode: (mode: ThemeMode | null) => void;
  readonly setElectrodeStandard: (standard: ElectrodeStandard) => void;
  readonly setReduceTransparency: (value: boolean) => void;
  readonly setReduceMotion: (value: boolean) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      mode: null,
      electrodeStandard: 'AHA',
      reduceTransparency: false,
      reduceMotion: false,
      setMode: (mode) => set({ mode }),
      setElectrodeStandard: (electrodeStandard) => set({ electrodeStandard }),
      setReduceTransparency: (reduceTransparency) => set({ reduceTransparency }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
    }),
    {
      name: 'ekg.settings',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo se persisten los valores. Las funciones se reconstruyen al crear
      // el store, y guardarlas ademas de ser imposible seria ruido en disco.
      partialize: (state) => ({
        mode: state.mode,
        electrodeStandard: state.electrodeStandard,
        reduceTransparency: state.reduceTransparency,
        reduceMotion: state.reduceMotion,
      }),
    },
  ),
);

/**
 * Indica si las preferencias ya se leyeron del disco.
 *
 * Importa para el arranque: la lectura es asincrona, asi que sin esperarla la
 * aplicacion pintaria un fotograma con el tema por defecto antes de saber cual
 * quiere el usuario. Ese destello en claro se ve, y por eso el splash nativo se
 * retiene hasta que esto sea cierto.
 *
 * @returns Cierto cuando la hidratacion ha terminado.
 */
export function useSettingsHydrated(): boolean {
  return useStoreHydrated(useSettings);
}
