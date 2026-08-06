import { useCallback, useEffect, useState } from 'react';

import { authenticateWithBiometrics } from '@/auth/biometrics';
import { UNLOCK_TEXT } from '@/constants/authText';

export interface BiometricUnlock {
  /** Cierto si el ultimo intento no pudo verificar al usuario. */
  readonly hasFailed: boolean;
  readonly attempt: () => void;
}

/**
 * Intento de desbloqueo biometrico.
 *
 * El intento arranca solo al montar, porque obligar a pulsar un boton para que
 * aparezca el dialogo del sistema es un paso de mas en una pantalla cuyo unico
 * proposito es dejar pasar.
 *
 * El estado se actualiza dentro de la continuacion de la promesa y no en el
 * cuerpo del efecto: escribir estado en el cuerpo encadena renders y React lo
 * desaconseja expresamente.
 *
 * @param onSuccess Se invoca cuando la verificacion tiene exito.
 * @returns El estado del intento y la funcion para repetirlo.
 */
export function useBiometricUnlock(onSuccess: () => void): BiometricUnlock {
  const [hasFailed, setHasFailed] = useState(false);

  const attempt = useCallback(() => {
    void authenticateWithBiometrics(UNLOCK_TEXT.prompt).then((succeeded) => {
      setHasFailed(!succeeded);
      if (succeeded) {
        onSuccess();
      }
    });
  }, [onSuccess]);

  useEffect(() => {
    attempt();
  }, [attempt]);

  return { hasFailed, attempt };
}
