import { useRouter } from 'expo-router';
import { useCallback } from 'react';

import { setBiometricUnlockEnabled } from '@/auth/preferences';
import { useSession } from '@/auth/session';

/**
 * Salida del desbloqueo biometrico hacia la contrasena.
 *
 * Desactiva la preferencia ademas de cerrar la sesion: si el biometrico no
 * funciona en ese dispositivo, insistir en cada arranque solo estorba. El
 * usuario siempre puede volver a activarlo desde ajustes.
 *
 * @returns La funcion que devuelve al acceso por contrasena.
 */
export function usePasswordFallback(): () => void {
  const router = useRouter();
  const closeSession = useSession((state) => state.close);

  return useCallback(() => {
    void setBiometricUnlockEnabled(false)
      .then(() => closeSession())
      .then(() => router.replace('/login'));
  }, [closeSession, router]);
}
