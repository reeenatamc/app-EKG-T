import { Skia } from '@shopify/react-native-skia';

export const FORM_ICON_VIEWBOX = 24;

const EMAIL_PATH = 'M3 6 H21 V18 H3 Z M3 7.5 L12 13.5 L21 7.5';
const LOCK_PATH = 'M7 10 V7 Q7 3 12 3 Q17 3 17 7 V10 M5 10 H19 V20 H5 Z M12 14 V16';
const KEY_PATH =
  'M14 6 A4 4 0 1 0 18 10 L22 10 L22 14 L20 14 L20 16 L18 16 L17 15 L14 12 A4 4 0 0 0 14 6 Z';
const SHIELD_PATH = 'M12 3 L4 7 V12 Q4 17 12 21 Q20 17 20 12 V7 Z M12 8 V14 M9 11 H15';
const PULSE_PATH = 'M2 13 H6 L8 7 L12 18 L15 10 L17 14 H22';
/** Fonendoscopio: el instrumento, que es como se reconoce a quien ausculta. */
const STETHOSCOPE_PATH =
  'M5 3 V9 A7 7 0 0 0 19 9 V3 M12 16 V18 M12 18 A2.6 2.6 0 1 0 12 23.2 A2.6 2.6 0 1 0 12 18';

/** Birrete. Se lee antes que cualquier palabra, en cualquier idioma. */
const GRADUATE_PATH = 'M2 9 L12 4 L22 9 L12 14 Z M6 11 V16 Q12 19 18 16 V11';

/**
 * La marca de la aplicacion: el latido de su icono, sin la hoja que lo encierra.
 *
 * El icono de sistema es un rectangulo carmin con el trazo en hueso. Aqui se usa
 * solo el trazo: dentro de la aplicacion ya se esta en la aplicacion, asi que la
 * caja no identifica nada y lo unico que hace es poner un borde en una pantalla
 * que no tiene ninguno. Sin caja, ademas, la marca toma el color del tema y se
 * apoya en el lienzo en vez de flotar sobre el.
 */
const MARK_PATH = 'M2 12 H6 L7.5 9 L9 12 H10.5 L11.5 3 L13 21 L14.5 12 H16 L17.5 8.5 L19 12 H22';

/** Papelera, para eliminar. Tapa, cubo y dos lineas: se lee a dieciocho puntos. */
const TRASH_PATH = 'M4 7 H20 M9 7 V4 H15 V7 M6 7 L7 20 H17 L18 7 M10 11 V16 M14 11 V16';

/** Flecha de avance de una fila que lleva a otra pantalla. */
const CHEVRON_PATH = 'M9 5 L16 12 L9 19';

const CAMERA_PATH =
  'M4 8 H7 L9 5 H15 L17 8 H20 V19 H4 Z M12 10 A3.5 3.5 0 1 0 12 17 A3.5 3.5 0 1 0 12 10';

export const FORM_ICON_PATHS = {
  email: Skia.Path.MakeFromSVGString(EMAIL_PATH),
  password: Skia.Path.MakeFromSVGString(LOCK_PATH),
  key: Skia.Path.MakeFromSVGString(KEY_PATH),
  shield: Skia.Path.MakeFromSVGString(SHIELD_PATH),
  pulse: Skia.Path.MakeFromSVGString(PULSE_PATH),
  camera: Skia.Path.MakeFromSVGString(CAMERA_PATH),
  stethoscope: Skia.Path.MakeFromSVGString(STETHOSCOPE_PATH),
  graduate: Skia.Path.MakeFromSVGString(GRADUATE_PATH),
  mark: Skia.Path.MakeFromSVGString(MARK_PATH),
  trash: Skia.Path.MakeFromSVGString(TRASH_PATH),
  chevron: Skia.Path.MakeFromSVGString(CHEVRON_PATH),
} as const;

export type FormIconName = keyof typeof FORM_ICON_PATHS;
