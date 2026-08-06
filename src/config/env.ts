import Constants from 'expo-constants';

/**
 * Configuracion resuelta en tiempo de compilacion y leida en tiempo de ejecucion.
 */
export interface AppEnvironment {
  readonly name: string;
  readonly version: string;
  readonly apiBaseUrl: string;
}

const EXPO_CONFIG_UNAVAILABLE_ERROR =
  'No se pudo leer la configuracion de Expo. Reconstruye la app nativa: el binario instalado es anterior a app.config.ts.';

const MISSING_API_BASE_URL_ERROR =
  'Falta API_BASE_URL. Copia .env.example a .env y define la URL del backend.';

const MISSING_VERSION_ERROR = 'Falta la version en app.config.ts. Debe heredarse de package.json.';

/**
 * Lee y valida la configuracion de la app expuesta por expo-constants.
 *
 * Falla de forma explicita en lugar de devolver valores vacios: una URL de
 * backend ausente provocaria errores de red confusos mas adelante, y es mas
 * barato detectarlo al arrancar.
 *
 * @returns La configuracion validada de la aplicacion.
 * @throws {Error} Si expo-constants no expone configuracion alguna.
 * @throws {Error} Si falta la version o API_BASE_URL, o no son cadenas validas.
 */
export function getAppEnvironment(): AppEnvironment {
  const expoConfig = Constants.expoConfig;

  if (expoConfig === null || expoConfig === undefined) {
    throw new Error(EXPO_CONFIG_UNAVAILABLE_ERROR);
  }

  // expo-constants tipa "extra" de forma laxa, asi que se valida en ejecucion.
  const apiBaseUrl: unknown = expoConfig.extra?.apiBaseUrl;

  if (typeof apiBaseUrl !== 'string' || apiBaseUrl.length === 0) {
    throw new Error(MISSING_API_BASE_URL_ERROR);
  }

  if (typeof expoConfig.version !== 'string' || expoConfig.version.length === 0) {
    throw new Error(MISSING_VERSION_ERROR);
  }

  return { name: expoConfig.name, version: expoConfig.version, apiBaseUrl };
}
