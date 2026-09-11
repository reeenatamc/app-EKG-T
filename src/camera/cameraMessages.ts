import type { TiltMode } from '@/camera/tilt';
import { CAMERA_TEXT } from '@/constants/captureText';

/** Lo que la pantalla de captura sabe en este momento. */
export interface CameraMessageInput {
  readonly isAligned: boolean;
  /** Postura deducida, o null si el telefono no tiene sensor. */
  readonly tiltMode: TiltMode | null;
  readonly isTilted: boolean;
  readonly isDim: boolean;
  readonly hasCaptureFailed: boolean;
  readonly hasImportFailed: boolean;
  /** Cierto si girar el telefono daria un encuadre mas grande. */
  readonly suggestSideways: boolean;
}

/** Lo que se escribe sobre la vista previa. */
export interface CameraMessages {
  /** La postura, en micro-etiqueta, o null sin sensor. */
  readonly eyebrow: string | null;
  /** La instruccion o la confirmacion del encuadre. */
  readonly title: string;
  /** Avisos, del mas urgente al menos. */
  readonly notes: readonly string[];
}

/**
 * Decide que se escribe encima de la camara.
 *
 * TODO JUNTO Y EN UN SOLO SITIO. Antes la instruccion iba bajo el marco, los
 * avisos sobre el obturador y la postura bajo el nivel: tres bloques de texto en
 * tres sitios. Con el telefono en horizontal los tres se leian de lado. Ahora es
 * un solo bloque, y ese bloque gira con el telefono.
 *
 * EL ORDEN ES DE URGENCIA. Primero lo que fallo —la foto no se tomo, la imagen no
 * se abrio—, porque pide repetir algo; luego lo que va a estropear la foto —poca
 * luz, inclinacion—; y al final la sugerencia de girar, que mejora una foto que
 * ya saldria bien.
 *
 * @param input Estado de la captura.
 * @returns Etiqueta, titulo y avisos.
 */
export function cameraMessages(input: CameraMessageInput): CameraMessages {
  const notes = [
    input.hasCaptureFailed ? CAMERA_TEXT.shutterFailure : null,
    input.hasImportFailed ? CAMERA_TEXT.importFailure : null,
    input.isDim ? CAMERA_TEXT.dimWarning : null,
    input.isTilted ? CAMERA_TEXT.tiltWarning : null,
    input.suggestSideways ? CAMERA_TEXT.sidewaysHint : null,
  ].filter((note): note is NonNullable<typeof note> => note !== null);

  return {
    eyebrow: eyebrowFor(input.tiltMode),
    title: input.isAligned ? CAMERA_TEXT.aligned : CAMERA_TEXT.instruction,
    notes,
  };
}

/**
 * La postura en palabras.
 *
 * @param mode Postura, o null sin sensor.
 * @returns La etiqueta, o null.
 */
function eyebrowFor(mode: TiltMode | null): string | null {
  if (mode === null) {
    return null;
  }

  return mode === 'flat' ? CAMERA_TEXT.tiltModeFlat : CAMERA_TEXT.tiltModeUpright;
}
