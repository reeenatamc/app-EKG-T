import * as SecureStore from 'expo-secure-store';

/**
 * Persistencia de la credencial de acceso a api-EKG.
 *
 * Vive aparte de la sesion, y no por orden: `Session` no tiene campo para un
 * token porque ninguna pantalla necesita uno. La app modela lo que sus
 * pantallas usan, y guardar la credencial es trabajo del adaptador HTTP, que es
 * el unico que la envia.
 *
 * Se usa el mismo almacen seguro que la sesion, por el mismo motivo: en Android
 * respalda en el Keystore y en iOS en el Keychain, mientras que AsyncStorage
 * guarda en texto plano dentro del sandbox. Esta cadena abre los datos clinicos
 * de un usuario, asi que es justo lo que no puede quedar en texto plano.
 */
const TOKEN_KEY = 'ekg.token';

/**
 * Guarda la credencial devuelta por el servidor.
 *
 * @param token Credencial a persistir.
 * @throws {Error} Si el almacen seguro no esta disponible en el dispositivo.
 */
export async function saveToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

/**
 * Lee la credencial guardada.
 *
 * @returns La credencial, o null si no hay ninguna.
 */
export async function loadToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

/**
 * Borra la credencial guardada.
 *
 * @throws {Error} Si el almacen seguro no esta disponible en el dispositivo.
 */
export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}
