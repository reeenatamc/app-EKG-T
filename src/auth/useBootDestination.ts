import { useEffect, useState } from 'react';

import { hasCompletedOnboarding, isBiometricUnlockEnabled } from '@/auth/preferences';
import { useSession } from '@/auth/session';

/** Rutas a las que puede derivar el arranque. */
export type BootDestination = '/onboarding' | '/login' | '/unlock' | '/home';

interface BootPreferences {
  readonly hasOnboarded: boolean;
  readonly wantsBiometric: boolean;
}

/**
 * Resuelve a donde debe ir la aplicacion despues del splash.
 *
 * El destino se **deriva** de la sesion y las preferencias, no se asigna desde
 * un efecto: escribir estado dentro de un efecto encadena renders y React lo
 * desaconseja. Lo unico que hace el efecto es leer del almacen seguro, que es
 * un sistema externo, y publicar el resultado una sola vez.
 *
 * Devuelve null mientras aun no se sabe. Llevar a login a alguien que si tenia
 * sesion es un fallo visible, asi que se prefiere esperar a estar seguro.
 *
 * @returns La ruta de destino, o null mientras se resuelve.
 */
export function useBootDestination(): BootDestination | null {
  const status = useSession((state) => state.status);
  const restore = useSession((state) => state.restore);
  const [preferences, setPreferences] = useState<BootPreferences | null>(null);

  useEffect(() => {
    void restore();
  }, [restore]);

  useEffect(() => {
    let isActive = true;

    void Promise.all([hasCompletedOnboarding(), isBiometricUnlockEnabled()]).then(
      ([hasOnboarded, wantsBiometric]) => {
        if (isActive) {
          setPreferences({ hasOnboarded, wantsBiometric });
        }
      },
    );

    return () => {
      isActive = false;
    };
  }, []);

  if (status === 'restoring' || preferences === null) {
    return null;
  }

  if (status === 'authenticated') {
    return preferences.wantsBiometric ? '/unlock' : '/home';
  }

  return preferences.hasOnboarded ? '/login' : '/onboarding';
}
