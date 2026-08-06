import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import type { Session } from '@/auth/AuthService';
import { useSession } from '@/auth/session';

/**
 * Abre la sesion y entra en la aplicacion.
 *
 * Lo usan las dos pantallas que pueden terminar en sesion abierta —acceso y
 * verificacion— para que ambas hagan exactamente lo mismo: publicar la sesion y
 * reemplazar la ruta, nunca apilarla, de modo que el boton atras no devuelva a
 * un formulario ya superado.
 *
 * @returns La funcion que abre la sesion y navega.
 */
export function useEnterApp(): (session: Session) => void {
  const router = useRouter();
  const openSession = useSession((state) => state.open);

  return useCallback(
    (session: Session) => {
      openSession(session);
      router.replace('/home');
    },
    [openSession, router],
  );
}
