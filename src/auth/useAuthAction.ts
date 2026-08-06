import { useCallback, useState } from 'react';

import type { AuthFailureReason, AuthResult } from '@/auth/AuthService';

export interface AuthAction {
  /** Cierto mientras la peticion esta en curso. */
  readonly isBusy: boolean;
  /** Causa del ultimo fallo, o null. Nunca un texto: el copy lo decide la interfaz. */
  readonly failureReason: AuthFailureReason | null;
  readonly run: <T>(
    request: () => Promise<AuthResult<T>>,
    onSuccess: (value: T) => void,
  ) => Promise<void>;
}

/**
 * Mecanica comun de los formularios de acceso.
 *
 * Concentra aqui el estado de ocupado y la causa del fallo para que las seis
 * pantallas se comporten igual: limpiar el error al reintentar, no dejar el
 * boton pulsable dos veces, y no dejar nunca escapar un mensaje del servidor.
 *
 * Un fallo inesperado se traduce a "unexpected" en vez de propagarse: una
 * excepcion sin capturar en una pantalla de acceso deja al usuario ante una
 * pantalla roja sin saber que hacer.
 *
 * @returns El estado de la accion y la funcion que la ejecuta.
 */
export function useAuthAction(): AuthAction {
  const [isBusy, setIsBusy] = useState(false);
  const [failureReason, setFailureReason] = useState<AuthFailureReason | null>(null);

  const run = useCallback(
    async <T>(request: () => Promise<AuthResult<T>>, onSuccess: (value: T) => void) => {
      setIsBusy(true);
      setFailureReason(null);

      try {
        const result = await request();
        if (result.ok) {
          onSuccess(result.value);
          return;
        }
        setFailureReason(result.failure.reason);
      } catch (error) {
        console.error('[auth] la peticion fallo de forma inesperada', error);
        setFailureReason('unexpected');
      } finally {
        setIsBusy(false);
      }
    },
    [],
  );

  return { isBusy, failureReason, run };
}
