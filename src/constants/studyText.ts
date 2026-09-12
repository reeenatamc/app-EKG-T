import type { StudyState } from '@/capture/studyState';
import type { AnalysisFailureReason, AnalysisStatus } from '@/ecg/EcgAnalysisService';

/**
 * Textos del historial, el detalle y el visor.
 *
 * Fuera de los componentes, como los de autenticacion y captura: la redaccion
 * de un texto clinico se revisa distinto que la logica que lo dispara.
 */

export const STUDY_TEXT = {
  detailTitle: 'Estudio',
  signalSection: 'Trazado',
  viewTrace: 'Trazado',
  viewPhoto: 'Foto original',
  viewSwitchLabel: 'Ver el trazado digitalizado o la foto original',
  zoomHint: 'Toca una derivación para verla de cerca.',
  zoomTitle: 'Derivación',
  zoomSquare: 'Cuadro pequeño',
  zoomClose: 'Cerrar',
  measurementsSection: 'Medidas',
  observationsSection: 'Observaciones',
  notesSection: 'Anotaciones',
  /**
   * El aviso clinico, otra vez y en el sitio donde importa.
   *
   * Aparecio en la introduccion, pero eso fue una vez y hace semanas. Aqui es
   * donde alguien podria tomar una decision, asi que aqui vuelve a decirse.
   */
  supportOnly:
    'Lo que sigue es una lectura automática de la imagen, no un diagnóstico. Confírmalo con el trazado y con el paciente.',
  observationNeedsReview: 'Requiere confirmación',
  /**
   * Lo mismo, dicho una vez para toda la lista.
   *
   * Se repetia en cada observacion, diez veces en una lectura corriente, y a la
   * tercera ya no se lee: una advertencia que se repite hasta ser ruido deja de
   * advertir. Va en la cabecera de la lista, y cada fila lo sigue diciendo a quien
   * la escucha con lector de pantalla, que no ve la cabecera al recorrerlas.
   */
  observationsReviewAll: 'Todas requieren confirmación clínica.',
  confidenceLabel: 'confianza',
  /** Lo que se abre al tocar una observacion. */
  observationOpen: 'Ver detalle',
  observationClose: 'Ocultar detalle',
  observationScore: 'Puntuación del modelo',
  /**
   * Por que se dice esto en cada detalle.
   *
   * La cifra de al lado se lee como una probabilidad —«87% de tener esto»— y no
   * lo es: es la salida cruda de una red, sin calibrar contra prevalencia. Que
   * suba tampoco significa que el hallazgo sea mas grave.
   */
  observationScoreNote: 'Es una puntuación del modelo, no una probabilidad. No indica gravedad.',
  observationAboveThreshold: 'Supera el umbral del modelo.',
  observationBelowThreshold: 'No supera el umbral del modelo.',
  observationNoThreshold: 'Todavía no hay un umbral definido para esta observación.',
  /**
   * De donde sale la lectura.
   *
   * El modelo no localiza hallazgos: recibe una senal y devuelve puntuaciones,
   * sin saber en cual se ve cada cosa. Lo unico que se puede decir es de que
   * derivaciones salio la lectura entera, y en un 3x4 eso son las tiras de
   * ritmo: tres de las doce. Ensenarlo hace visible un limite que si no lo es.
   */
  basisLabel: 'La lectura sale de',
  showBasis: 'Resaltar en el trazado',
  hideBasis: 'Quitar resaltado',

  /**
   * El trazado, antes de que termine la interpretacion.
   *
   * La digitalizacion es la mitad rapida del analisis, unos quince segundos;
   * la interpretacion la lenta, de treinta a cincuenta y cinco. Sin esto, ver
   * el trazado antes de tiempo parece un adelanto del resultado en vez de lo
   * que es: lo que ya se leyo, mientras lo demas sigue en marcha.
   */
  signalReadCaption: 'Trazado leído. La interpretación sigue en curso.',
  /**
   * El trazado, cuando la interpretacion no llego a terminar.
   *
   * Un fallo tras la digitalizacion no borra lo que ya se leyo del papel, y
   * quien hizo la foto sigue queriendo verlo aunque el analisis no saliera.
   */
  signalReadFailureCaption: 'Esto es lo que se pudo leer.',

  noObservations: 'No se ha observado nada destacable. Revisa el trazado igualmente.',
  notesPlaceholder: 'Lo que quieras recordar de este estudio',
  notesHint: 'Se guardan solo en este dispositivo. No escribas datos que identifiquen al paciente.',
  saveNote: 'Guardar anotación',
  exportAction: 'Exportar informe',
  /**
   * El informe no se generó.
   *
   * No se nombra el PDF ni el motor de impresión: quien lo lee quiere el
   * informe, y de qué pieza falló no puede hacer nada.
   */
  exportFailure: {
    title: 'No se pudo generar el informe',
    action: 'El estudio no se ha tocado. Vuelve a intentarlo.',
  },
  compareAction: 'Comparar con otro',
  retryAnalysis: 'Reintentar el análisis',
} as const;

/** Nombre y explicacion de cada medida. */
export const MEASUREMENT_LABELS = {
  heartRateBpm: { label: 'Frecuencia', unit: 'lpm' },
  prIntervalMs: { label: 'Intervalo PR', unit: 'ms' },
  qrsDurationMs: { label: 'Duración QRS', unit: 'ms' },
  qtIntervalMs: { label: 'Intervalo QT', unit: 'ms' },
  qtcMs: { label: 'QT corregido', unit: 'ms' },
  axisDegrees: { label: 'Eje', unit: 'grados' },
} as const;

export const STATUS_TEXT: Record<AnalysisStatus, string> = {
  queued: 'En cola',
  processing: 'Procesando',
  ready: 'Listo',
  failed: 'No se pudo procesar',
};

/** Que se le dice al usuario en cada estado, y que puede esperar. */
export const STATUS_DETAIL: Record<AnalysisStatus, string> = {
  queued: 'El estudio ha llegado y espera turno.',
  processing: 'Se está recuperando la señal del papel.',
  ready: 'La señal se ha recuperado.',
  failed: 'El estudio sigue guardado y se puede reintentar.',
};

/**
 * Por que no salio un analisis.
 *
 * Cada causa dice tambien que hacer, porque un aviso sin salida es una queja.
 */
export const ANALYSIS_FAILURE_COPY: Record<AnalysisFailureReason, string> = {
  'unreadable-image':
    'No se ha podido leer el trazado en la imagen. Suele bastar con repetir la foto con más luz.',
  'grid-not-detected':
    'No se ha encontrado la retícula milimetrada. Comprueba que la hoja salga completa y sin reflejos.',
  'trace-incomplete':
    'Se ha leído la imagen, pero el trazado salió incompleto o muy fragmentado para interpretarlo. Repite la foto más cerca, con la hoja plana y sin sombras.',
  'unsupported-mount':
    'El montaje indicado no coincide con lo que hay en la imagen. Revísalo y vuelve a enviarlo.',
  'network-unreachable': 'No hay conexión. El estudio sigue guardado y se reintenta al volver.',
  'server-error': 'El servidor no responde ahora mismo. El estudio no se ha perdido.',
  unexpected: 'Algo falló al procesar. El estudio sigue guardado y se puede reintentar.',
};

/** Estado de un estudio tal como se ensena en las listas. Ver `studyState`. */
export const STUDY_STATE_TEXT: Record<StudyState, string> = {
  waiting: 'En espera',
  sending: 'Enviando',
  analyzing: 'Analizando',
  ready: 'Listo',
  failed: 'Con error',
};

/**
 * Eliminar un estudio del historial.
 *
 * El texto cambia segun el estudio se haya enviado o no, porque lo que se pierde
 * es distinto: uno sin enviar se lleva la unica copia de la foto, y uno enviado
 * solo desaparece de este telefono. Decirlo mal en cualquiera de los dos sentidos
 * es malo: asustar de mas hace que nadie limpie, y de menos, perder una foto.
 */
export const DELETE_STUDY_TEXT = {
  swipeAction: 'Eliminar',
  swipeHint: 'Desliza un estudio hacia la derecha para eliminarlo.',
  title: '¿Eliminar este estudio?',
  removeBody:
    'Desaparece del historial de este teléfono, con su nota. La copia que ya está en el servidor no se borra.',
  discardBody:
    'Este estudio no llegó a enviarse: su foto se borra del teléfono y no se puede recuperar.',
  cancel: 'Cancelar',
  confirm: 'Eliminar',
} as const;

export const HISTORY_LIST_TEXT = {
  title: 'Estudios',
  sectionQueue: 'Pendientes de enviar',
  sectionAnalysed: 'Enviados',
} as const;

export const COMPARE_TEXT = {
  title: 'Comparar',
  hint: 'Elige un segundo estudio. Se muestran uno sobre otro, con la misma escala.',
  pick: 'Elegir estudio',
  clear: 'Quitar comparación',
  /**
   * La escala compartida no es un detalle de presentacion.
   *
   * Dos trazados dibujados a escalas distintas invitan a comparar amplitudes que
   * no son comparables, y eso es peor que no comparar.
   */
  sameScaleNote: 'Ambos se dibujan a la misma escala, para que las amplitudes sean comparables.',
} as const;

export const CLINICAL_NOTICE = {
  body: 'Lectura orientativa. Confirma los resultados con un profesional de salud.',
} as const;
