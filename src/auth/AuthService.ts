/**
 * Contrato de autenticacion, definido desde lo que necesitan las pantallas.
 *
 * Deliberadamente NO se modela sobre la forma del backend: api-EKG todavia esta
 * moviendose, y si siete pantallas se acoplan a un contrato provisional habra
 * que tocarlas todas cuando cambie. Cuando llegue el momento de conectar, esta
 * interfaz es la referencia y el adaptador es quien se adapta.
 *
 * Ninguna pantalla debe saber si detras hay una simulacion o un servidor.
 */

/** Rol elegido en el registro. Condiciona lo que el usuario ve despues. */
export type UserRole = 'professional' | 'student';

export interface Session {
  readonly userId: string;
  readonly email: string;
  readonly role: UserRole;
}

/** Estado intermedio: la cuenta existe pero falta confirmar el codigo. */
export interface PendingVerification {
  readonly email: string;
  readonly expiresInSeconds: number;
}

/**
 * Motivos de fallo, no mensajes.
 *
 * El servicio nunca devuelve texto para mostrar: devuelve una causa, y la capa
 * de interfaz decide como se cuenta. Asi es imposible que un "Error 401" del
 * servidor acabe en pantalla, y el copy vive en un solo sitio.
 */
export type AuthFailureReason =
  | 'credentials-mismatch'
  | 'account-not-found'
  | 'email-already-registered'
  | 'weak-password'
  | 'code-mismatch'
  | 'code-expired'
  | 'network-unreachable'
  | 'unexpected';

export interface AuthFailure {
  readonly reason: AuthFailureReason;
}

/** Resultado explicito: obliga a quien llama a contemplar el fallo. */
export type AuthResult<T> =
  | { readonly ok: true; readonly value: T }
  | {
      readonly ok: false;
      readonly failure: AuthFailure;
    };

export interface SignInInput {
  readonly email: string;
  readonly password: string;
}

export interface RegisterInput extends SignInInput {
  readonly role: UserRole;
}

export interface VerifyCodeInput {
  readonly email: string;
  readonly code: string;
}

export interface AuthService {
  /** Recupera la sesion guardada, o null si no hay ninguna vigente. */
  restoreSession(): Promise<Session | null>;
  signIn(input: SignInInput): Promise<AuthResult<Session>>;
  /** Registra la cuenta y deja pendiente la verificacion por codigo. */
  register(input: RegisterInput): Promise<AuthResult<PendingVerification>>;
  verifyCode(input: VerifyCodeInput): Promise<AuthResult<Session>>;
  requestPasswordReset(email: string): Promise<AuthResult<PendingVerification>>;
  signOut(): Promise<void>;
}
