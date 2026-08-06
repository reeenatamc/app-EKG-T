import * as LocalAuthentication from 'expo-local-authentication';

/**
 * Desbloqueo biometrico.
 *
 * Siempre opcional: el usuario puede desactivarlo, y toda pantalla que lo use
 * debe ofrecer una salida por contrasena. Un sensor sucio, un dedo mojado o una
 * mano con guante no pueden dejar a nadie fuera de su propia cuenta.
 */

/**
 * Indica si el dispositivo puede pedir biometria ahora mismo.
 *
 * Comprueba las dos condiciones por separado porque significan cosas
 * distintas: que exista sensor y que haya algo registrado en el. Un movil con
 * lector pero sin huellas dadas de alta no puede autenticar.
 *
 * @returns Cierto si hay sensor y credenciales biometricas registradas.
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const hasSensor = await LocalAuthentication.hasHardwareAsync();

  if (!hasSensor) {
    return false;
  }

  return LocalAuthentication.isEnrolledAsync();
}

/**
 * Pide autenticacion biometrica al usuario.
 *
 * @param promptMessage Texto que muestra el dialogo del sistema.
 * @returns Cierto si la autenticacion tuvo exito.
 */
export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage,
    // Se desactiva el respaldo del sistema porque la aplicacion ofrece el suyo:
    // volver a la contrasena de la cuenta, no al PIN del dispositivo.
    disableDeviceFallback: true,
  });

  return result.success;
}
