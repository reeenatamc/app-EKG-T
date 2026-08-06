/**
 * Textos visibles de la aplicacion.
 *
 * Viven fuera de los componentes para que el JSX no contenga cadenas literales
 * y para que traducir la interfaz no obligue a tocar componentes.
 *
 * El copy no es diseno: no pertenece a src/design/ y no sale de tokens.ts.
 */
export const CAMERA_SCREEN_TEXT = {
  instruction: 'Encuadra el trazado completo dentro del marco',
  shutterLabel: 'Capturar electrocardiograma',
} as const;

export const REVIEW_SCREEN_TEXT = {
  title: 'Revisa la captura',
  hint: 'Comprueba que el trazado se lee completo y sin cortes',
  discard: 'Descartar',
  confirm: 'Confirmar',
  imageLabel: 'Electrocardiograma capturado',
} as const;

export const PLAYGROUND_TEXT = {
  title: 'Banco de pruebas',
  modeLabel: 'Modo',
  modeLight: 'Claro',
  modeDark: 'Oscuro',
  modeSystem: 'Sistema',
  reduceTransparency: 'Reducir transparencia',
  reduceMotion: 'Reducir movimiento',
  glassTitle: 'Tarjeta de contexto',
  glassBody:
    'Vidrio sobre el fondo. Con la transparencia reducida cae a superficie opaca sin perder jerarquía.',
  typeTitle: 'Escala tipográfica',
  vitalSample: '72',
  vitalCaption: 'Cifra clínica: monoespaciada y sobre superficie opaca',
  chromeLabel: 'Chrome flotante',
  gestureHint: 'Arrastra el punto: comprueba que los gestos corren en el hilo de UI',
  gestureLabel: 'Arrastra',
  beatHint: 'Latido del arranque. Pulsa para repetirlo y revisarlo en cada tema.',
  beatReplay: 'Repetir el latido del arranque',
  scrollTitle: 'Carga de scroll',
  scrollHint: 'Desplaza para medir los fotogramas sostenidos',
} as const;

export const PERMISSION_TEXT = {
  checking: 'Comprobando el permiso de cámara…',
  title: 'Necesitamos la cámara',
  rationale:
    'La aplicación fotografía el electrocardiograma en papel. Sin acceso a la cámara no puede capturar el trazado.',
  grant: 'Permitir el acceso',
  openSettings: 'Abrir los ajustes',
  deniedHint: 'Denegaste el permiso. Puedes activarlo desde los ajustes del sistema.',
} as const;
