/**
 * Copy del armazon de la aplicacion: navegacion, inicio, perfil y ajustes.
 */
export const TAB_TEXT = {
  home: 'Inicio',
  history: 'Historial',
  capture: 'Capturar',
  profile: 'Perfil',
} as const;

/**
 * Etiquetas de las salidas de pantalla.
 *
 * Son las que oye un lector de pantalla, porque en pantalla estos dos controles
 * son solo un dibujo. «Volver» a secas y no «volver a Historial»: la pantalla de
 * la que se sale no siempre es la misma —al detalle de un estudio se puede
 * llegar por enlace profundo— y una etiqueta que nombra un destino equivocado es
 * peor que una que no nombra ninguno.
 */
export const NAV_TEXT = {
  back: 'Volver',
} as const;

/**
 * Saludo de inicio, por franja del día.
 *
 * Las tres formas estándar del español, con los cortes en 6, 12 y 20. La lógica
 * que elige vive en `src/shell/greeting.ts` y está probada.
 */
export const GREETING_TEXT = {
  morning: 'Buenos días',
  afternoon: 'Buenas tardes',
  evening: 'Buenas noches',
} as const;

/**
 * Nombres de día y de mes, escritos a mano.
 *
 * NO SE USA `toLocaleDateString` CON OPCIONES. Formatear con `weekday: 'long'`
 * depende de que el motor traiga ICU completo, y en Hermes eso no está
 * garantizado: donde falta, devuelve el nombre en inglés o el patrón crudo, y
 * sería un fallo silencioso que solo se ve en el dispositivo. Doce cadenas y
 * siete son baratas comparadas con esa duda.
 */
export const CALENDAR_TEXT = {
  weekdays: ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'],
  months: [
    'enero',
    'febrero',
    'marzo',
    'abril',
    'mayo',
    'junio',
    'julio',
    'agosto',
    'septiembre',
    'octubre',
    'noviembre',
    'diciembre',
  ],
} as const;

export const HOME_TEXT = {
  heroTitle: 'Fotografía un electrocardiograma',
  heroBody: 'Encuadra el trazado en papel y la aplicación lo endereza, lo recorta y lo prepara.',
  heroAction: 'Capturar ahora',
  recentTitle: 'Últimos estudios',
  recentEmpty: 'Todavía ninguno',
  recentOne: '1 guardado',
  recentMany: 'guardados',
  pendingTitle: 'En proceso',
  pendingEmpty: 'Nada en cola',
  pendingOne: '1 estudio esperando',
  pendingMany: 'estudios esperando',
  noticeTitle: 'Apoyo, no diagnóstico',
  noticeBody: 'Los resultados son orientativos y los confirma un profesional.',
} as const;

export const HISTORY_TEXT = {
  title: 'Historial',
  emptyTitle: 'Aquí aparecerán tus estudios',
  emptyBody:
    'Cada electrocardiograma que fotografíes queda guardado con su fecha y su lectura, listo para volver a consultarlo.',
  emptyAction: 'Capturar el primero',
} as const;

export const PROFILE_TEXT = {
  title: 'Perfil',
  roleProfessional: 'Profesional de salud',
  roleStudent: 'Estudiante o demostración',
  roleLabel: 'Rol',
  emailLabel: 'Cuenta',
  /**
   * Qué se muestra si la sesión no trae correo.
   *
   * Antes quedaba una fila etiquetada «Cuenta» con el valor vacío, que se lee
   * como una avería. Un hueco en un dato dice algo, y hay que decirlo.
   */
  emailMissing: 'Sin correo asociado',
  settingsAction: 'Ajustes',
} as const;

export const SETTINGS_TEXT = {
  title: 'Ajustes',
  appearanceSection: 'Apariencia',
  themeLabel: 'Tema',
  themeSystem: 'Sistema',
  themeLight: 'Claro',
  themeDark: 'Oscuro',
  accessibilitySection: 'Accesibilidad',
  reduceTransparency: 'Reducir transparencia',
  reduceTransparencyHint: 'Sustituye el vidrio por superficies opacas.',
  reduceMotion: 'Reducir movimiento',
  reduceMotionHint: 'Las animaciones aparecen en su estado final.',
  clinicalSection: 'Clínico',
  electrodeLabel: 'Estándar de electrodos',
  electrodeHint: 'Los dos códigos de color son incompatibles; elige el que usas.',
  languageLabel: 'Idioma',
  languageValue: 'Español',
  languageNote: 'La aplicación está en un solo idioma.',
  accountSection: 'Cuenta',
  signOut: 'Cerrar sesión',
} as const;
