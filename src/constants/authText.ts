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
    title: 'Ese correo y esa contraseña no coinciden',
    action: 'Revísalos, o entra con un código si prefieres no recordarla.',
  },
  'account-not-found': {
    title: 'No encontramos ninguna cuenta con ese correo',
    action: 'Comprueba que esté bien escrito, o crea una cuenta nueva.',
  },
  'email-already-registered': {
    title: 'Ese correo ya tiene una cuenta',
    action: 'Inicia sesión, o recupera el acceso si no recuerdas la contraseña.',
  },
  'weak-password': {
    title: 'La contraseña necesita ocho caracteres o más',
    action: 'Añade unos cuantos y vuelve a intentarlo.',
  },
  'code-mismatch': {
    title: 'Ese código no es el que enviamos',
    action: 'Revisa los seis dígitos del correo, o pide uno nuevo.',
  },
  'code-expired': {
    title: 'El código caducó',
    action: 'Pide uno nuevo: llega en unos segundos.',
  },
  'network-unreachable': {
    title: 'No hay conexión con el servidor',
    action: 'Comprueba tu red y vuelve a intentarlo. No se perdió nada.',
  },
  unexpected: {
    title: 'Algo falló por nuestra parte',
    action: 'Vuelve a intentarlo. Si sigue pasando, no es culpa tuya.',
  },
};

export const SPLASH_TEXT = {
  appName: 'EKG Reader',
} as const;

export const ONBOARDING_TEXT = {
  skip: 'Saltar',
  next: 'Siguiente',
  start: 'Empezar',
  /**
   * Contador de paso, en monoespaciada sobre el titular.
   *
   * Sustituye a los tres puntos que había debajo. Dice lo mismo con más
   * precisión y en una sola línea, y los puntos eran la única cosa de la
   * pantalla que no se podía leer en voz alta.
   */
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
  title: 'Entra en tu cuenta',
  email: 'Correo',
  password: 'Contraseña',
  submit: 'Entrar',
  forgot: '¿Olvidaste la contraseña?',
  toRegister: 'Crear una cuenta',
  biometric: 'Entrar con huella',
} as const;

export const REGISTER_TEXT = {
  title: 'Crea tu cuenta',
  email: 'Correo',
  password: 'Contraseña',
  passwordHint: 'Ocho caracteres o más',
  roleLabel: '¿Cómo vas a usar la aplicación?',
  roleProfessional: 'Profesional de salud',
  roleProfessionalHint: 'Acceso completo a estudios e interpretación',
  roleStudent: 'Estudiante o demostración',
  roleStudentHint: 'Mismo flujo, con avisos formativos y datos de ejemplo',
  submit: 'Continuar',
  toLogin: 'Ya tengo cuenta',
} as const;

export const RECOVERY_TEXT = {
  title: 'Recupera el acceso',
  body: 'Escribe tu correo y te enviamos un código de seis dígitos.',
  email: 'Correo',
  submit: 'Enviar el código',
  toLogin: 'Volver a entrar',
} as const;

export const VERIFY_TEXT = {
  title: 'Escribe el código',
  bodyPrefix: 'Enviamos seis dígitos a',
  code: 'Código',
  submit: 'Verificar',
  resend: 'Enviar otro código',
} as const;

export const UNLOCK_TEXT = {
  title: 'Desbloquea la aplicación',
  body: 'Usa tu huella o tu rostro para continuar.',
  unlock: 'Desbloquear',
  usePassword: 'Entrar con la contraseña',
  prompt: 'Desbloquea EKG Reader',
  failed: 'No se pudo verificar',
  failedAction: 'Prueba otra vez, o entra con la contraseña de tu cuenta.',
} as const;
