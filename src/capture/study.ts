/**
 * El estudio: lo que se captura, se describe y se envia.
 *
 * Modulo puro. Define que viaja al servidor y, sobre todo, que no viaja.
 *
 * NO HAY CAMPO DE NOMBRE, y su ausencia es deliberada. Una foto de un
 * electrocardiograma con el nombre del paciente al lado deja de ser un dato
 * clinico anonimo y pasa a ser una historia clinica, con todo lo que eso
 * arrastra. La aplicacion nunca lo pide y no tiene donde guardarlo.
 */

import type { MountId } from '@/camera/mounts';
import type { Quad } from '@/camera/quad';

/**
 * Calibracion con la que se imprimio el registro.
 *
 * Sin ella la digitalizacion no puede convertir milimetros en milivoltios ni en
 * segundos: son la escala de los dos ejes. Los valores por defecto son los
 * estandar, pero se editan porque no son universales; media velocidad se usa
 * para caber diez segundos en menos papel, y media amplitud cuando el complejo
 * satura y se solapa con la fila de arriba.
 */
export interface Calibration {
  /** Velocidad del papel, en milimetros por segundo. Estandar: 25. */
  readonly speedMmPerSecond: number;
  /** Amplitud, en milimetros por milivoltio. Estandar: 10. */
  readonly gainMmPerMillivolt: number;
}

export const STANDARD_CALIBRATION: Calibration = {
  speedMmPerSecond: 25,
  gainMmPerMillivolt: 10,
};

/** Velocidades y amplitudes que ofrece la interfaz, en su orden. */
export const CALIBRATION_SPEEDS = [12.5, 25, 50] as const;
export const CALIBRATION_GAINS = [5, 10, 20] as const;

export interface StudyMetadata {
  /**
   * Identificador anonimo del estudio.
   *
   * Se genera solo y el usuario puede sustituirlo por el codigo de su propio
   * registro. Nunca es un nombre: ver la cabecera de este modulo.
   */
  readonly anonymousId: string;
  /** Momento de la captura, en ISO 8601. */
  readonly capturedAt: string;
  readonly mount: MountId;
  readonly calibration: Calibration;
  /**
   * Las cuatro esquinas del papel, en pixeles de la imagen que se envia.
   *
   * Viajan como dato en lugar de aplicarse a los pixeles. Corregir la
   * perspectiva aqui obligaria a remuestrear la imagen y el remuestreo es donde
   * se pierde un trazo de un milimetro; el servidor la corrige sobre la
   * resolucion nativa. Ver la cabecera de camera/homography.ts.
   */
  readonly quad: Quad;
}

export type StudyStatus = 'pending' | 'uploading' | 'failed' | 'uploaded';

export interface QueuedStudy {
  readonly id: string;
  /** Ruta local de la imagen, en almacenamiento privado de la aplicacion. */
  readonly imageUri: string;
  readonly imageWidth: number;
  readonly imageHeight: number;
  readonly metadata: StudyMetadata;
  readonly status: StudyStatus;
  /** Intentos de envio consumidos. Ver MAX_AUTOMATIC_ATTEMPTS. */
  readonly attempts: number;
  readonly lastFailure: UploadFailureReason | null;
}

/**
 * Causas de que un envio no salga.
 *
 * Causas, no textos, por el mismo motivo que en AuthService: la interfaz decide
 * como se cuenta cada una y el servicio solo dice que paso.
 */
export type UploadFailureReason =
  'network-unreachable' | 'unauthorized' | 'payload-rejected' | 'server-error' | 'unexpected';

/** Prefijo de los identificadores generados. */
const ID_PREFIX = 'ECG';

/** Longitud del sufijo aleatorio, suficiente para no repetir dentro de una jornada. */
export const ID_SUFFIX_LENGTH = 4;

/**
 * Compone un identificador anonimo legible.
 *
 * Legible a proposito: el usuario tiene que poder leerlo en voz alta o
 * apuntarlo junto al caso en su propio registro, que es lo que sustituye al
 * nombre. Lleva la fecha porque ordena y ayuda a reconocerlo, y un sufijo
 * aleatorio porque en una jornada se capturan varios.
 *
 * Es una funcion pura: recibe la fecha y el azar en lugar de leerlos, para
 * poder probarla.
 *
 * @param capturedAt Momento de la captura.
 * @param suffix Sufijo aleatorio ya generado.
 * @returns El identificador, por ejemplo ECG-260729-4K2M.
 */
export function formatAnonymousId(capturedAt: Date, suffix: string): string {
  const year = String(capturedAt.getFullYear()).slice(2);
  const month = String(capturedAt.getMonth() + 1).padStart(2, '0');
  const day = String(capturedAt.getDate()).padStart(2, '0');

  return `${ID_PREFIX}-${year}${month}${day}-${suffix.toUpperCase()}`;
}

/**
 * Normaliza lo que el usuario escribe en el identificador.
 *
 * Deja mayusculas, digitos y guiones, y corta a una longitud corta. No es una
 * medida de seguridad —nadie puede impedir que alguien teclee un apellido en
 * mayusculas— sino una senal de forma: un campo que rechaza espacios y acentos
 * comunica que espera un codigo y no un nombre, antes incluso de leer la ayuda.
 *
 * @param raw Texto tal cual lo escribio el usuario.
 * @returns El identificador normalizado.
 */
export function normalizeAnonymousId(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, 24);
}
