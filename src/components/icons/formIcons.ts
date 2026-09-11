import { Skia } from '@shopify/react-native-skia';

export const FORM_ICON_VIEWBOX = 24;

const EMAIL_PATH = 'M3 6 H21 V18 H3 Z M3 7.5 L12 13.5 L21 7.5';
const LOCK_PATH = 'M7 10 V7 Q7 3 12 3 Q17 3 17 7 V10 M5 10 H19 V20 H5 Z M12 14 V16';
const KEY_PATH =
  'M14 6 A4 4 0 1 0 18 10 L22 10 L22 14 L20 14 L20 16 L18 16 L17 15 L14 12 A4 4 0 0 0 14 6 Z';
const SHIELD_PATH = 'M12 3 L4 7 V12 Q4 17 12 21 Q20 17 20 12 V7 Z M12 8 V14 M9 11 H15';
const PULSE_PATH = 'M2 13 H6 L8 7 L12 18 L15 10 L17 14 H22';
const CAMERA_PATH =
  'M4 8 H7 L9 5 H15 L17 8 H20 V19 H4 Z M12 10 A3.5 3.5 0 1 0 12 17 A3.5 3.5 0 1 0 12 10';

export const FORM_ICON_PATHS = {
  email: Skia.Path.MakeFromSVGString(EMAIL_PATH),
  password: Skia.Path.MakeFromSVGString(LOCK_PATH),
  key: Skia.Path.MakeFromSVGString(KEY_PATH),
  shield: Skia.Path.MakeFromSVGString(SHIELD_PATH),
  pulse: Skia.Path.MakeFromSVGString(PULSE_PATH),
  camera: Skia.Path.MakeFromSVGString(CAMERA_PATH),
} as const;

export type FormIconName = keyof typeof FORM_ICON_PATHS;
