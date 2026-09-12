import type { AuthFailureReason } from '@/auth/AuthService';

/**
 * Copy de autenticacion.
 *
 * Los errores se disenan. Cada fallo dice **que paso** y **que hacer**, en el
 * idioma del usuario, y no culpa a la persona. Ningun codigo de estado ni
 * mensaje del servidor llega nunca a pantalla: el servicio devuelve una causa y
 * este archivo decide como se cuenta.
 */
export interface AuthErrorCopy {
  readonly title: string;
  readonly action: string;
}

export const AUTH_ERROR_COPY: Record<AuthFailureReason, AuthErrorCopy> = {
  'credentials-mismatch': {
    title: 'Correo o contraseña incorrectos',
    action: 'Revisa tus datos o recupera el acceso mediante un código.',
  },
  'account-not-found': {
    title: 'No hay una cuenta con ese correo',
    action: 'Comprueba el correo o crea una cuenta.',
  },
  'email-already-registered': {
    title: 'El correo ya está registrado',
    action: 'Inicia sesión o recupera el acceso si olvidaste la contraseña.',
  },
  'weak-password': {
    title: 'La contraseña debe tener al menos ocho caracteres',
    action: 'Introduce una contraseña de ocho caracteres o más.',
  },
  'code-mismatch': {
    title: 'Código incorrecto',
    action: 'Revisa los seis dígitos del correo o solicita un código nuevo.',
  },
  'code-expired': {
    title: 'El código caducó',
    action: 'Solicita un código nuevo e introdúcelo para continuar.',
  },
  'network-unreachable': {
    title: 'No hay conexión con el servidor',
    action: 'Comprueba tu conexión a internet y vuelve a intentarlo.',
  },
  unexpected: {
    title: 'No se pudo completar la solicitud',
    action: 'Vuelve a intentarlo. Si el error persiste, inténtalo más tarde.',
  },
};

export const SPLASH_TEXT = {
  appName: 'EKG Reader',
} as const;

export const ONBOARDING_TEXT = {
  skip: 'Saltar',
  next: 'Siguiente',
  start: 'Empezar',
  /** Contador de paso que sustituye a los puntos sin texto accesible. */
  stepCounter: 'Paso',
  steps: [
    {
      title: 'Fotografía el trazado',
      body: 'Encuadra el electrocardiograma en papel. La app se encarga de enderezarlo y recortarlo.',
    },
    {
      title: 'Se digitaliza y se interpreta',
      body: 'La señal se reconstruye desde la imagen y se analiza. Verás el trazado y una lectura ordenada por probabilidad.',
    },
    {
      title: 'Es apoyo, no diagnóstico',
      body: 'Esta aplicación no diagnostica ni sustituye el criterio clínico. Sus resultados son orientativos y deben confirmarse por un profesional antes de tomar cualquier decisión sobre un paciente.',
    },
  ],
} as const;

export const LOGIN_TEXT = {
  title: 'Iniciar sesión',
  email: 'Correo',
  password: 'Contraseña',
  submit: 'Iniciar sesión',
  forgot: '¿Olvidaste la contraseña?',
  toRegister: 'Crear una cuenta',
  biometric: 'Entrar con huella',
} as const;

export const REGISTER_TEXT = {
  title: 'Crear cuenta',
  email: 'Correo',
  password: 'Contraseña',
  passwordHint: 'Ocho caracteres o más',
  roleLabel: 'Tipo de uso',
  roleProfessional: 'Profesional de salud',
  roleProfessionalHint: 'Acceso completo a estudios e interpretación',
  roleStudent: 'Estudiante o demostración',
  roleStudentHint: 'Estudios con avisos formativos y datos de ejemplo',
  /**
   * Version corta para el cuadro de la opcion.
   *
   * El texto largo sigue siendo el que se lee en voz alta: con dos opciones una
   * al lado de la otra no cabe una frase entera sin que el cuadro deje de ser un
   * cuadro, pero quien navega a ciegas necesita lo que implica elegir, no un
   * resumen de tres palabras.
   */
  roleProfessionalShort: 'Estudios completos',
  roleStudentShort: 'Con apoyo formativo',
  submit: 'Continuar',
  toLogin: 'Ya tengo cuenta',
} as const;

export const RECOVERY_TEXT = {
  title: 'Recuperar acceso',
  body: 'Introduce tu correo para recibir un código de seis dígitos.',
  email: 'Correo',
  submit: 'Enviar código',
  toLogin: 'Volver al inicio de sesión',
} as const;

export const VERIFY_TEXT = {
  title: 'Verificar código',
  bodyPrefix: 'Código enviado a',
  code: 'Código',
  submit: 'Verificar',
  resend: 'Enviar otro código',
} as const;

export const UNLOCK_TEXT = {
  title: 'Desbloquear aplicación',
  body: 'Usa tu huella o tu rostro para continuar.',
  unlock: 'Desbloquear',
  usePassword: 'Entrar con la contraseña',
  prompt: 'Desbloquear EKG Reader',
  failed: 'No se pudo verificar',
  failedAction: 'Vuelve a intentarlo o inicia sesión con tu contraseña.',
} as const;
