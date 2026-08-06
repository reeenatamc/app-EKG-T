import * as SecureStore from 'expo-secure-store';

/**
 * Preferencias persistentes ligadas al acceso.
 *
 * Viven en el almacen seguro y no en el store de ajustes por un motivo
 * practico: el store todavia no persiste, y estas dos preferencias no sirven de
 * nada si se olvidan al cerrar la aplicacion. Un onboarding que reaparece en
 * cada arranque, o un desbloqueo biometrico que hay que reactivar cada vez, son
 * peores que no tenerlos.
 */
const ONBOARDING_KEY = 'ekg.onboardingCompleted';
const BIOMETRIC_KEY = 'ekg.biometricUnlock';

const TRUE = 'true';

/**
 * Indica si el usuario ya completo la introduccion.
 *
 * @returns Cierto si el onboarding ya se vio.
 */
export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await SecureStore.getItemAsync(ONBOARDING_KEY)) === TRUE;
}

/**
 * Marca la introduccion como completada.
 *
 * @throws {Error} Si el almacen seguro no esta disponible en el dispositivo.
 */
export async function completeOnboarding(): Promise<void> {
  await SecureStore.setItemAsync(ONBOARDING_KEY, TRUE);
}

/**
 * Indica si el usuario dejo activado el desbloqueo biometrico.
 *
 * @returns Cierto si el biometrico esta activado.
 */
export async function isBiometricUnlockEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === TRUE;
}

/**
 * Activa o desactiva el desbloqueo biometrico.
 *
 * @param enabled Nuevo estado de la preferencia.
 * @throws {Error} Si el almacen seguro no esta disponible en el dispositivo.
 */
export async function setBiometricUnlockEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, TRUE);
    return;
  }
  await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
}
