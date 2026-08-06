import type {
  AuthFailureReason,
  AuthResult,
  AuthService,
  PendingVerification,
  RegisterInput,
  Session,
  SignInInput,
  UserRole,
  VerifyCodeInput,
} from '@/auth/AuthService';
import { clearSession, loadSession, saveSession } from '@/auth/sessionStorage';

/**
 * Implementacion simulada del contrato de autenticacion.
 *
 * Existe para que las pantallas se puedan construir y probar antes de que el
 * contrato de api-EKG este cerrado. Persiste de verdad en el almacen seguro, de
 * modo que la restauracion de sesion al arrancar se ejercita como en
 * produccion; lo unico simulado es la validacion de credenciales.
 */

/** Latencia simulada, para que los estados de carga se vean durante el desarrollo. */
const SIMULATED_LATENCY_MS = 600;

/** Codigo aceptado por la verificacion mientras no exista servidor. */
const ACCEPTED_CODE = '123456';

const VERIFICATION_WINDOW_SECONDS = 600;

const MINIMUM_PASSWORD_LENGTH = 8;

/**
 * Rol elegido en el registro, a la espera de que se verifique el codigo.
 *
 * En produccion esto lo recuerda el servidor entre el registro y la
 * verificacion. Aqui se guarda en memoria porque su unico proposito es que el
 * rol elegido llegue intacto a la sesion.
 */
const pendingRoles = new Map<string, UserRole>();

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, SIMULATED_LATENCY_MS));
}

function succeed<T>(value: T): AuthResult<T> {
  return { ok: true, value };
}

function reject<T>(reason: AuthFailureReason): AuthResult<T> {
  return { ok: false, failure: { reason } };
}

async function openSession(email: string, role: UserRole): Promise<Session> {
  const session: Session = { userId: `mock-${email}`, email, role };
  await saveSession(session);
  return session;
}

export const mockAuthService: AuthService = {
  async restoreSession(): Promise<Session | null> {
    return loadSession();
  },

  async signIn({ email, password }: SignInInput): Promise<AuthResult<Session>> {
    await delay();

    if (password.length < MINIMUM_PASSWORD_LENGTH) {
      return reject('credentials-mismatch');
    }

    return succeed(await openSession(email, pendingRoles.get(email) ?? 'professional'));
  },

  async register({
    email,
    password,
    role,
  }: RegisterInput): Promise<AuthResult<PendingVerification>> {
    await delay();

    if (password.length < MINIMUM_PASSWORD_LENGTH) {
      return reject('weak-password');
    }

    pendingRoles.set(email, role);
    return succeed({ email, expiresInSeconds: VERIFICATION_WINDOW_SECONDS });
  },

  async verifyCode({ email, code }: VerifyCodeInput): Promise<AuthResult<Session>> {
    await delay();

    if (code !== ACCEPTED_CODE) {
      return reject('code-mismatch');
    }

    return succeed(await openSession(email, pendingRoles.get(email) ?? 'student'));
  },

  async requestPasswordReset(email: string): Promise<AuthResult<PendingVerification>> {
    await delay();
    return succeed({ email, expiresInSeconds: VERIFICATION_WINDOW_SECONDS });
  },

  async signOut(): Promise<void> {
    await clearSession();
  },
};
