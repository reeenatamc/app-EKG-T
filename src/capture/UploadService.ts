/**
 * Contrato de envio de estudios.
 *
 * Se diseña desde el consumo, igual que AuthService: la cola necesita saber si
 * el envio salio y, si no salio, por que causa, para decidir si reintenta sola
 * o si pide ayuda al usuario. No necesita saber de HTTP, ni de codigos de
 * estado, ni de formularios multiparte.
 *
 * La implementacion real llega en la Etapa 5, cuando se cierre el contrato con
 * api-EKG. Hasta entonces gobierna MockUploadService.
 */

import type { QueuedStudy, UploadFailureReason } from '@/capture/study';

export interface UploadReceipt {
  /** Identificador que asigna el servidor. Es la prueba de que llego. */
  readonly remoteId: string;
  /** Momento en que el servidor acuso recibo, en ISO 8601. */
  readonly receivedAt: string;
}

export type UploadResult =
  | { readonly ok: true; readonly value: UploadReceipt }
  | { readonly ok: false; readonly failure: { readonly reason: UploadFailureReason } };

export interface UploadService {
  /**
   * Envia un estudio al servidor.
   *
   * No lanza por un fallo de red ni por una respuesta de error: esos son
   * resultados previstos y viajan en el valor devuelto, porque la cola tiene
   * que actuar distinto segun cual sea.
   *
   * @param study Estudio a enviar, con su imagen ya en disco.
   * @returns El acuse de recibo, o la causa por la que no salio.
   */
  send(study: QueuedStudy): Promise<UploadResult>;
}
