import type { AnalysisFailureReason } from '@/ecg/EcgAnalysisService';

/**
 * Causas en las que volver a pedir el analisis puede dar otra respuesta.
 *
 * Son las que no dependen de la imagen: el servidor no contesto, o no estaba la
 * red, o fallo algo que nadie ha sabido nombrar. La imagen sigue subida y el
 * trabajo pendiente, asi que pedirlo otra vez es lo unico que hay que hacer.
 */
const WORTH_RETRYING: readonly AnalysisFailureReason[] = [
  'network-unreachable',
  'server-error',
  'unexpected',
];

/**
 * Cierto si reintentar el analisis puede terminar de otra manera.
 *
 * OFRECER UN BOTON QUE NO PUEDE FUNCIONAR ES PEOR QUE NO OFRECER NINGUNO. Las
 * demas causas son propiedades de la fotografia o de la hoja: que no se lea el
 * trazado, que el montaje no sea el que se dijo, que el registro no traiga
 * ninguna derivacion completa. Ninguna cambia porque se pida otra vez, asi que
 * un boton de reintentar ahi solo consigue que alguien lo pulse un rato.
 *
 * Esto no siempre fue asi, y conviene dejarlo escrito. El digitalizador daba
 * respuestas distintas al mismo archivo, asi que reintentar era volver a tirar
 * los dados y a veces salia: un estudio llego a fallar dos veces y salir a la
 * tercera sin tocar una linea de codigo. Desde que la digitalizacion es
 * reproducible, esa loteria ya no existe -- lo cual esta bien, pero deja al
 * boton sin nada que hacer en estos casos.
 *
 * Lo que si cambia el resultado es volver a fotografiar, o usar otra hoja, y eso
 * es lo que dice el texto de cada causa.
 *
 * @param reason Causa del fallo, o null si el servidor no dio ninguna.
 * @returns Cierto si merece la pena ofrecer reintentar.
 */
export function isWorthRetrying(reason: AnalysisFailureReason | null): boolean {
  // Sin causa no se sabe que paso, y entonces se ofrece: es preferible un boton
  // que quiza no sirva a dejar sin salida a alguien cuyo estudio si podria salir.
  if (reason === null) {
    return true;
  }

  return WORTH_RETRYING.includes(reason);
}
