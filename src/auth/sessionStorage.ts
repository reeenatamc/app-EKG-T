import * as SecureStore from 'expo-secure-store';

import type { Session } from '@/auth/AuthService';

/**
 * Persistencia de la sesion en el almacen seguro del dispositivo.
 *
 * Se usa expo-secure-store y nunca AsyncStorage: en Android respalda las claves
 * en el Keystore y en iOS en el Keychain, mientras que AsyncStorage guarda en
 * texto plano en el sandbox de la aplicacion. Una credencial de acceso a datos
 * clinicos no puede vivir en texto plano.
 */
const SESSION_KEY = 'ekg.session';

/**
 * Guarda la sesion activa.
 *
 * @param session Sesion a persistir.
 * @throws {Error} Si el almacen seguro no esta disponible en el dispositivo.
 */
export async function saveSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

/**
 * Lee la sesion guardada.
 *
 * Devuelve null tanto si no hay nada guardado como si lo guardado no se puede
 * interpretar: una sesion corrupta es equivalente a no tener sesion, y es
 * preferible pedir credenciales otra vez que arrancar con datos a medias.
 *
 * @returns La sesion persistida, o null.
 */
export async function loadSession(): Promise<Session | null> {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);

  if (raw === null) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch (error) {
    console.warn('[auth] la sesion guardada no se pudo interpretar; se descarta', error);
    return null;
  }
}

/**
 * Borra la sesion guardada.
 *
 * @throws {Error} Si el almacen seguro no esta disponible en el dispositivo.
 */
export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
