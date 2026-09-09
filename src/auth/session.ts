import { create } from 'zustand';

import type { Session } from '@/auth/AuthService';
import { authService } from '@/auth/service';

/**
 * Estado de la sesion.
 *
 * "restoring" existe como estado propio y no como un booleano de carga: el
 * splash necesita distinguir "todavia no se sabe" de "no hay sesion", porque
 * llevar a login a alguien que si tenia sesion es un fallo visible.
 */
export type SessionStatus = 'restoring' | 'authenticated' | 'anonymous';

interface SessionState {
  readonly status: SessionStatus;
  readonly session: Session | null;
  readonly restore: () => Promise<void>;
  readonly open: (session: Session) => void;
  readonly close: () => Promise<void>;
}

/**
 * Sesion activa de la aplicacion.
 *
 * Habla con el contrato AuthService, no con un servidor. Cambiar la
 * implementacion simulada por la real no toca este archivo ni ninguna pantalla.
 *
 * @returns El estado de sesion y sus transiciones.
 */
export const useSession = create<SessionState>((set) => ({
  status: 'restoring',
  session: null,

  restore: async () => {
    const session = await authService.restoreSession();
    set(
      session === null
        ? { status: 'anonymous', session: null }
        : { status: 'authenticated', session },
    );
  },

  open: (session) => set({ status: 'authenticated', session }),

  close: async () => {
    await authService.signOut();
    set({ status: 'anonymous', session: null });
  },
}));
