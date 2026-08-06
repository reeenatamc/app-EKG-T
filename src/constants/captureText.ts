import type { MountId } from '@/camera/mounts';
import type { QualityIssue } from '@/camera/quality';
import type { UploadFailureReason } from '@/capture/study';

/**
 * Textos del modulo de fotografia.
 *
 * Viven fuera de los componentes por el mismo motivo que los de autenticacion:
 * la redaccion de un aviso se revisa distinto que la logica que lo dispara, y
 * cuando estan mezclados no se revisa ninguna de las dos.
 */

export const CAMERA_TEXT = {
  instruction: 'Encuadra el registro dentro del marco',
  aligned: 'Encuadre correcto',
  tiltLabel: 'Inclinación',
  tiltWarning: 'Mantén el teléfono paralelo al papel',
  /**
   * Postura que ha deducido el nivel.
   *
   * Se dice en pantalla porque el instrumento cambia de pregunta solo, y un
   * instrumento que cambia de criterio sin avisar se lee como averiado: quien
   * levanta el teléfono ve el punto saltar y no sabe si es él o es la aplicación.
   * Dos palabras lo explican.
   */
  tiltModeFlat: 'Papel en mesa',
  tiltModeUpright: 'Papel en vertical',
  dimWarning: 'Hay poca luz para fotografiar papel',
  fromGallery: 'Elegir de la galeria',
  shutterLabel: 'Capturar',
} as const;

export interface MountCopy {
  readonly label: string;
  /** Una linea que diga que es, para quien no reconozca el nombre. */
  readonly hint: string;
}

/**
 * Nombres de los montajes.
 *
 * Cada uno lleva una linea de apoyo porque quien captura no siempre es quien
 * imprimio: un estudiante en practicas reconoce la hoja antes que el nombre del
 * reparto, y elegir mal aqui estropea toda la digitalizacion.
 */
export const MOUNT_COPY: Record<MountId, MountCopy> = {
  'standard-3x4': {
    label: '3x4 estandar',
    hint: 'Doce derivaciones en cuatro columnas de 2,5 s',
  },
  'rhythm-3x4': {
    label: '3x4 + tiras de ritmo',
    hint: 'El reparto estandar con una tira continua al pie',
  },
  'right-3x3': {
    label: '3x3 derechas (V4R-V6R)',
    hint: 'Precordiales derechas, ante sospecha de infarto de ventriculo derecho',
  },
  'six-2': {
    label: '6x2',
    hint: 'Doce derivaciones en dos columnas de 5 s',
  },
  'twelve-1': {
    label: '12x1',
    hint: 'Las doce apiladas, diez segundos cada una',
  },
};

export interface QualityCopy {
  /** Que pasa. Describe la foto, nunca a quien la tomo. */
  readonly title: string;
  /** Por que importa, en una linea y en el idioma de quien captura. */
  readonly why: string;
  /** Que hacer para mejorarlo. */
  readonly action: string;
}

/**
 * Como se cuenta cada defecto.
 *
 * Tres reglas que se siguen en las cuatro entradas:
 *
 * Se describe la foto, no a la persona. "La foto salio movida", no "moviste la
 * camara". El aviso llega en un momento en que alguien esta trabajando deprisa
 * y hacerle sentir torpe no mejora la siguiente foto.
 *
 * Se explica la consecuencia, no la medida. "Resolucion insuficiente" es cierto
 * y no dice nada; que el trazo mide menos de un milimetro y que a esa escala se
 * pierde senal, si.
 *
 * Se dice que hacer. Un aviso sin salida es una queja.
 */
export const QUALITY_COPY: Record<QualityIssue, QualityCopy> = {
  'low-resolution': {
    title: 'La foto tiene poco detalle',
    why: 'El trazo mide menos de un milimetro de ancho. A esta resolucion se pierde parte de la senal, y eso no se recupera despues.',
    action: 'Acercate hasta que el papel llene el marco.',
  },
  blurry: {
    title: 'La foto salio movida',
    why: 'Los bordes del trazo estan difusos, y el borde es justo lo que se mide para reconstruir la senal.',
    action: 'Apoya los codos y espera a que la camara enfoque antes de disparar.',
  },
  glare: {
    title: 'Hay un reflejo sobre el papel',
    why: 'Debajo del brillo no queda reticula ni trazo que leer: esa parte del registro llega en blanco.',
    action: 'Cambia el angulo o aparta la lampara que se refleja.',
  },
  underexposed: {
    title: 'La foto salio oscura',
    why: 'Con poca luz el ruido del sensor tiene el mismo grosor que el trazo, y se confunden.',
    action: 'Busca mas luz antes de repetirla.',
  },
};

/**
 * Nombre de cada esquina, en el orden del contrato de Quad.
 *
 * Sirven para que un lector de pantalla pueda decir cual es cual. El ajuste con
 * el dedo no es accesible de por si, pero tampoco es obligatorio: las esquinas
 * parten del marco ya encuadrado y el flujo se completa sin tocarlas.
 */
export const CORNER_LABELS = [
  'Esquina superior izquierda',
  'Esquina superior derecha',
  'Esquina inferior derecha',
  'Esquina inferior izquierda',
] as const;

export const REVIEW_TEXT = {
  title: 'Ajusta las esquinas',
  hint: 'Arrastra cada esquina hasta el borde del papel. La perspectiva se corrige sola.',
  crossedQuad: 'Las esquinas se han cruzado. Devuelve una a su sitio para seguir.',
  preview: 'Con la perspectiva corregida',
  previewHint: 'Asi quedara el registro una vez enderezado.',
  reset: 'Volver al encuadre',
  discard: 'Repetir la foto',
  continueAction: 'Continuar',
  imageLabel: 'Fotografia del electrocardiograma con las esquinas ajustables',
} as const;

export const CONFIRM_TEXT = {
  title: 'Antes de enviar',
  qualitySection: 'Calidad de la imagen',
  qualityClean: 'La foto cumple lo que necesita la digitalizacion.',
  qualityWarningNote: 'Puedes enviarla igualmente. Esto es un aviso, no un bloqueo.',
  mountSection: 'Montaje',
  mountHint:
    'Es el dato que mas condiciona la lectura: indica como estan repartidas las derivaciones en la hoja.',
  calibrationSection: 'Calibracion',
  calibrationHint:
    'Los valores estandar son 25 mm/s y 10 mm/mV. Cambialos si la hoja dice otra cosa.',
  speedLabel: 'Velocidad del papel',
  gainLabel: 'Amplitud',
  identitySection: 'Identificacion',
  identityLabel: 'Identificador del estudio',
  /**
   * La ayuda dice explicitamente que no se escriban nombres.
   *
   * No es una barrera tecnica —nadie puede impedir que alguien teclee un
   * apellido— sino la unica forma honesta de dejar claro que esta aplicacion no
   * quiere ese dato y no tiene donde guardarlo.
   */
  identityHint:
    'Se genera solo. Puedes sustituirlo por el codigo de tu propio registro. No escribas nombres de pacientes: esta aplicacion no los pide ni los guarda.',
  submit: 'Enviar estudio',
  back: 'Volver a las esquinas',
} as const;

export const QUEUE_TEXT = {
  title: 'Estudios en cola',
  empty: 'No hay estudios esperando.',
  pending: 'En espera',
  uploading: 'Enviando',
  failed: 'No se pudo enviar',
  uploaded: 'Enviado',
  retry: 'Reintentar',
  discard: 'Descartar',
  discardedNote: 'Descartar borra la foto del dispositivo.',
} as const;

/**
 * Por que no salio un envio.
 *
 * Mismo criterio que en autenticacion: se dice que paso y que se puede hacer,
 * sin codigos de estado ni jerga de red.
 */
export const UPLOAD_FAILURE_COPY: Record<UploadFailureReason, string> = {
  'network-unreachable':
    'No hay conexion. El estudio se queda guardado y se enviara cuando vuelva.',
  unauthorized: 'La sesion caduco. Vuelve a entrar y el envio se reanuda.',
  'payload-rejected':
    'El servidor no acepto la imagen. Revisa el montaje elegido y vuelve a intentarlo.',
  'server-error': 'El servidor no responde ahora mismo. El estudio sigue guardado aqui.',
  unexpected: 'Algo fallo al enviar. El estudio no se ha perdido: sigue en la cola.',
};
