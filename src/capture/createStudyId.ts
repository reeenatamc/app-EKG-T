import * as Crypto from 'expo-crypto';

import { formatAnonymousId, ID_SUFFIX_LENGTH } from '@/capture/study';

/**
 * Identificadores de un estudio.
 *
 * Hay dos, y son dos porque sirven a lectores distintos. El interno lo usan la
 * cola y el nombre del archivo, y solo tiene que no repetirse nunca. El anonimo
 * lo lee una persona: es lo que sustituye al nombre del paciente, asi que tiene
 * que poder leerse en voz alta y apuntarse al margen de una hoja.
 */

/** Caracteres del sufijo. Sin I, O, 0 ni 1: se confunden al leerlos o dictarlos. */
const SUFFIX_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/**
 * Identificador interno del estudio.
 *
 * @returns Un identificador universal unico.
 */
export function createStudyId(): string {
  return Crypto.randomUUID();
}

/**
 * Identificador anonimo, legible y dictable.
 *
 * El azar viene de expo-crypto y no de Math.random. No porque haga falta
 * criptografia para nombrar un estudio, sino porque Math.random puede repetir
 * al arrancar dos veces en el mismo instante, y dos estudios con el mismo
 * identificador en una jornada son un problema de trazabilidad clinica.
 *
 * @param capturedAt Momento de la captura.
 * @returns Un identificador como ECG-260729-4K2M.
 */
export function createAnonymousId(capturedAt: Date): string {
  const bytes = Crypto.getRandomBytes(ID_SUFFIX_LENGTH);

  let suffix = '';
  for (const byte of bytes) {
    suffix += SUFFIX_ALPHABET[byte % SUFFIX_ALPHABET.length];
  }

  return formatAnonymousId(capturedAt, suffix);
}
