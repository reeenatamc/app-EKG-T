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
  newStudy: 'Nuevo estudio',
  heroTitle: 'Lee un electrocardiograma',
  quickTitle: 'Acceso rápido',
  settings: 'Ajustes',
  newStudyHint: 'ECG estándar de 12 derivaciones, en papel.',
  summaryTitle: 'Resumen',
  summaryReady: 'Listos',
  summaryInProgress: 'En curso',
  summaryFailed: 'Con error',
  /** Lo que anuncia un lector de pantalla antes de las tres cifras. */
  summaryOpen: 'Abrir el historial',
  recentTitle: 'Recientes',
  recentAll: 'Ver todo',
  recentEmpty: 'Todavía no hay estudios. Los que fotografíes aparecerán aquí.',
  notice: 'Apoyo, no diagnóstico. Los resultados son orientativos y los confirma un profesional.',
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
  /**
   * Qué se muestra si la sesión no trae correo.
   *
   * Antes quedaba una fila etiquetada «Cuenta» con el valor vacío, que se lee
   * como una avería. Un hueco en un dato dice algo, y hay que decirlo.
   */
  emailMissing: 'Sin correo asociado',
  activitySection: 'En este teléfono',
  studiesLabel: 'Estudios guardados',
  lastStudyLabel: 'Último estudio',
  lastStudyNone: 'Ninguno todavía',
  activityNote:
    'El historial se guarda en este teléfono y se borra al cerrar sesión. Lo enviado sigue en el servidor.',
  preferencesSection: 'Preferencias',
  accountSection: 'Cuenta',
  settingsAction: 'Más ajustes',
  settingsHint: 'Accesibilidad e idioma',
  signOut: 'Cerrar sesión',
  version: 'versión',
} as const;

/**
 * La pregunta antes de cerrar sesión.
 *
 * Cerrar sesión borra el historial del teléfono. En Perfil es una fila de una
 * lista, y una fila se toca sin querer al desplazar; lo que se pierde con ese
 * toque no se recupera, así que se pregunta.
 */
export const SIGN_OUT_TEXT = {
  title: '¿Cerrar sesión?',
  body: 'El historial de este teléfono se borra. Lo enviado sigue en el servidor.',
  cancel: 'Cancelar',
  confirm: 'Cerrar sesión',
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
  haptics: 'Vibración al tocar',
  hapticsHint: 'Confirma con un toque el obturador, los envíos y los errores.',
  clinicalSection: 'Clínico',
  electrodeLabel: 'Estándar de electrodos',
  electrodeHint: 'Los dos códigos de color son incompatibles; elige el que usas.',
  languageLabel: 'Idioma',
  languageValue: 'Español',
  languageNote: 'La aplicación está en un solo idioma.',
  accountSection: 'Cuenta',
  signOut: 'Cerrar sesión',

  /**
   * Cerrar sesión con estudios sin enviar.
   *
   * El historial se guarda por dispositivo y no por cuenta, así que cerrar
   * sesión lo borra: sin eso, quien entrara después en el mismo teléfono vería
   * los electrocardiogramas del anterior. Lo enviado sigue en el servidor; lo
   * pendiente se pierde, y eso hay que decirlo antes y no después.
   */
  pendingOnSignOut: {
    title: 'Tienes estudios sin terminar',
    action:
      'Al cerrar sesión se borran del teléfono. Lo que no se ha enviado se pierde, y el resultado que aún falta ya no se podrá recoger.',
  },
} as const;
