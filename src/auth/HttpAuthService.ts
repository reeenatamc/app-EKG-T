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
import { clearToken, loadToken, saveToken } from '@/auth/tokenStorage';
import { httpRequest, NetworkUnreachableError, reasonFrom } from '@/net/http';

/**
 * Implementacion del contrato de autenticacion contra api-EKG.
 *
 * El contrato manda y este archivo se adapta, que es el reparto que declara
 * AuthService: las pantallas se escribieron contra una interfaz pensada desde
 * lo que necesitan, no desde la forma del servidor, y conectar no ha obligado a
 * tocar ninguna.
 *
 * La credencial viaja al lado de la sesion y no dentro, porque `Session` no
 * tiene campo para una. Se guarda aqui, en el almacen seguro, y se adjunta a
 * cada peticion que la necesite.
 */

/** Motivos que el servidor puede devolver y la interfaz sabe contar. */
const AUTH_REASONS: readonly AuthFailureReason[] = [
  'credentials-mismatch',
  'account-not-found',
  'email-already-registered',
  'weak-password',
  'code-mismatch',
  'code-expired',
  'unexpected',
];

function succeed<T>(value: T): AuthResult<T> {
  return { ok: true, value };
}

function reject<T>(reason: AuthFailureReason): AuthResult<T> {
  return { ok: false, failure: { reason } };
}

/**
 * Interpreta la sesion que devuelve el servidor.
 *
 * Se valida campo a campo en lugar de confiar en el tipo: lo que llega por red
 * es texto hasta que alguien lo comprueba, y una sesion a medias se guardaria
 * en el almacen seguro y reapareceria en cada arranque.
 *
 * @param value Valor crudo del cuerpo de la respuesta.
 * @returns La sesion, o null si no tiene la forma esperada.
 */
function sessionFrom(value: unknown): Session | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const { userId, email, role } = value as Record<string, unknown>;

  if (typeof userId !== 'string' || typeof email !== 'string') {
    return null;
  }

  if (role !== 'professional' && role !== 'student') {
    return null;
  }

  return { userId, email, role: role as UserRole };
}

/**
 * Interpreta la espera de verificacion que devuelve el servidor.
 *
 * @param value Valor crudo del cuerpo de la respuesta.
 * @param email Correo enviado, como respaldo si el servidor no lo repite.
 * @returns La verificacion pendiente, o null si no tiene la forma esperada.
 */
function pendingFrom(value: unknown, email: string): PendingVerification | null {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const expires = raw.expiresInSeconds;

  if (typeof expires !== 'number' || !Number.isFinite(expires)) {
    return null;
  }

  return {
    email: typeof raw.email === 'string' ? raw.email : email,
    expiresInSeconds: expires,
  };
}

/**
 * Guarda sesion y credencial juntas, que es como se usan.
 *
 * @param value Cuerpo de una respuesta que trae ambas.
 * @returns La sesion guardada, o null si la respuesta no era utilizable.
 */
async function openSession(value: unknown): Promise<Session | null> {
  if (typeof value !== 'object' || value === null) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const session = sessionFrom(raw.session);

  if (session === null || typeof raw.token !== 'string') {
    return null;
  }

  await saveToken(raw.token);
  await saveSession(session);

  return session;
}

/**
 * Envia una peticion de autenticacion y traduce el fallo al vocabulario del contrato.
 *
 * @param path Ruta del endpoint.
 * @param json Cuerpo a enviar.
 * @returns El cuerpo de la respuesta si fue correcta, o el motivo del rechazo.
 */
async function post(
  path: string,
  json: unknown,
): Promise<{ ok: true; body: unknown } | { ok: false; reason: AuthFailureReason }> {
  try {
    const response = await httpRequest(path, { method: 'POST', json });

    if (response.status >= 200 && response.status < 300) {
      return { ok: true, body: response.body };
    }

    return { ok: false, reason: reasonFrom(response.body, AUTH_REASONS, 'unexpected') };
  } catch (error) {
    if (error instanceof NetworkUnreachableError) {
      return { ok: false, reason: 'network-unreachable' };
    }

    throw error;
  }
}

export const httpAuthService: AuthService = {
  /**
   * Recupera la sesion guardada y la contrasta con el servidor.
   *
   * SIN RED SE ENTRA IGUAL. El endpoint existe para descubrir una sesion muerta
   * -- cerrada desde otro dispositivo -- antes de la primera subida, en lugar de
   * enterarse entonces. Pero un arranque sin cobertura no es una sesion muerta,
   * y echar al usuario por eso convertiria una molestia en una perdida de
   * acceso. Solo se borra lo guardado cuando el servidor responde que ya no vale.
   */
  async restoreSession(): Promise<Session | null> {
    const stored = await loadSession();
    const token = await loadToken();

    if (stored === null || token === null) {
      return null;
    }

    try {
      const response = await httpRequest('/auth/session/', { token });

      if (response.status === 401 || response.status === 403) {
        await clearSession();
        await clearToken();
        return null;
      }

      if (response.status >= 200 && response.status < 300) {
        const fresh = sessionFrom((response.body as { session?: unknown } | null)?.session);

        if (fresh !== null) {
          await saveSession(fresh);
          return fresh;
        }
      }
    } catch (error) {
      if (!(error instanceof NetworkUnreachableError)) {
        throw error;
      }
    }

    return stored;
  },

  async signIn({ email, password }: SignInInput): Promise<AuthResult<Session>> {
    const result = await post('/auth/sign-in/', { email, password });

    if (!result.ok) {
      return reject(result.reason);
    }

    const session = await openSession(result.body);

    return session === null ? reject('unexpected') : succeed(session);
  },

  async register({
    email,
    password,
    role,
  }: RegisterInput): Promise<AuthResult<PendingVerification>> {
    const result = await post('/auth/register/', { email, password, role });

    if (!result.ok) {
      return reject(result.reason);
    }

    const pending = pendingFrom(result.body, email);

    return pending === null ? reject('unexpected') : succeed(pending);
  },

  async verifyCode({ email, code }: VerifyCodeInput): Promise<AuthResult<Session>> {
    const result = await post('/auth/verify/', { email, code });

    if (!result.ok) {
      return reject(result.reason);
    }

    const session = await openSession(result.body);

    return session === null ? reject('unexpected') : succeed(session);
  },

  async requestPasswordReset(email: string): Promise<AuthResult<PendingVerification>> {
    const result = await post('/auth/password-reset/', { email });

    if (!result.ok) {
      return reject(result.reason);
    }

    const pending = pendingFrom(result.body, email);

    return pending === null ? reject('unexpected') : succeed(pending);
  },

  /**
   * Cierra la sesion.
   *
   * SE BORRA LO LOCAL PASE LO QUE PASE. El contrato no devuelve resultado, asi
   * que no hay forma de contarle a nadie que el servidor no contesto, y dejar la
   * credencial en el dispositivo porque no hubo red significaria que pulsar
   * "cerrar sesion" no cierra la sesion.
   */
  async signOut(): Promise<void> {
    const token = await loadToken();

    if (token !== null) {
      try {
        await httpRequest('/auth/sign-out/', { method: 'POST', token });
      } catch (error) {
        if (!(error instanceof NetworkUnreachableError)) {
          throw error;
        }

        console.warn('[auth] no se pudo avisar al servidor del cierre de sesion');
      }
    }

    await clearToken();
    await clearSession();
  },
};
