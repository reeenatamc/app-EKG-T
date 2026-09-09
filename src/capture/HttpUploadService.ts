import { File, UploadType, type UploadOptions } from 'expo-file-system';

import { loadToken } from '@/auth/tokenStorage';
import type { UploadReceipt, UploadResult, UploadService } from '@/capture/UploadService';
import type { QueuedStudy, UploadFailureReason } from '@/capture/study';
import { apiUrl, reasonFrom } from '@/net/http';

/**
 * Implementacion del envio de estudios contra api-EKG.
 *
 * La cola sigue mandando: este archivo no decide si se reintenta ni cuando,
 * solo dice que paso. Es el reparto que declara UploadService, y es lo que
 * permite que la cola, sus estados y sus pantallas no se hayan tocado al
 * cambiar la simulacion por el servidor.
 *
 * NO USA `fetch`, a diferencia del resto de adaptadores, y no por gusto.
 *
 * El primer intento construyo el cuerpo multiparte a mano y adjunto la imagen
 * como `{uri, name, type}`, que es la receta clasica de React Native. React
 * Native 0.86 la rechaza: «Unsupported FormDataPart implementation». Y el
 * sintoma no se parece a la causa, porque `fetch` rechaza igual la promesa ante
 * un cuerpo que no sabe construir que ante una red caida: el estudio se quedaba
 * anunciando "no hay conexion" con el servidor a un cable de distancia.
 *
 * `File.upload` es el camino que expo-file-system ofrece para esto, y evita las
 * dos cosas: compone el multiparte en codigo nativo y envia el archivo en
 * streaming desde el disco, sin cargarlo en memoria. Con fotos de 4000x3000 eso
 * no es un detalle de estilo.
 */

/** Motivos que el servidor puede devolver y la cola sabe tratar. */
const UPLOAD_REASONS: readonly UploadFailureReason[] = [
  'unauthorized',
  'payload-rejected',
  'server-error',
  'unexpected',
];

function reject(reason: UploadFailureReason): UploadResult {
  return { ok: false, failure: { reason } };
}

/**
 * Tipo MIME de la imagen, deducido de su extension.
 *
 * Al otro lado hay un ImageField de Django que valida con Pillow. Un tipo
 * equivocado se rechaza como imagen invalida, que es un motivo enganoso para lo
 * que en realidad seria un descuido nuestro.
 *
 * @param file Archivo de la imagen.
 * @returns El tipo MIME a declarar.
 */
function mimeTypeOf(file: File): string {
  return file.extension.toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
}

/**
 * Interpreta el cuerpo de la respuesta, que la subida entrega como texto.
 *
 * @param body Texto recibido.
 * @returns El objeto, o null si no era JSON.
 */
function parsed(body: string): unknown {
  try {
    return body.length > 0 ? JSON.parse(body) : null;
  } catch {
    return null;
  }
}

/**
 * Interpreta el acuse de recibo del servidor.
 *
 * Se comprueba en lugar de confiar en el tipo porque este valor es la prueba de
 * que el estudio llego: la cola lo guarda y, acto seguido, borra la imagen del
 * dispositivo. Un acuse a medias borraria la unica copia de la foto de un
 * paciente a cambio de nada.
 *
 * @param body Cuerpo ya interpretado de la respuesta.
 * @returns El acuse, o null si no tiene la forma esperada.
 */
function receiptFrom(body: unknown): UploadReceipt | null {
  if (typeof body !== 'object' || body === null) {
    return null;
  }

  const { remoteId, receivedAt } = body as Record<string, unknown>;

  if (typeof remoteId !== 'string' || remoteId.length === 0) {
    return null;
  }

  if (typeof receivedAt !== 'string' || receivedAt.length === 0) {
    return null;
  }

  return { remoteId, receivedAt };
}

/**
 * Compone la peticion de subida que espera api-EKG.
 *
 * @param study Estudio a enviar.
 * @param token Credencial de sesion.
 * @param file Archivo de la imagen.
 * @returns Las opciones de la subida multiparte.
 */
function optionsFor(study: QueuedStudy, token: string, file: File): UploadOptions {
  return {
    httpMethod: 'POST',
    uploadType: UploadType.MULTIPART,
    fieldName: 'image',
    mimeType: mimeTypeOf(file),
    headers: { Accept: 'application/json', Authorization: `Token ${token}` },
    parameters: {
      imageWidth: String(study.imageWidth),
      imageHeight: String(study.imageHeight),
      // Los metadatos van como una cadena JSON en un campo, y no repartidos en
      // campos sueltos, porque el servidor los valida como el objeto que son: el
      // cuadrilatero tiene que llegar entero para poder comprobar que no se cruza.
      metadata: JSON.stringify(study.metadata),
    },
  };
}

export const httpUploadService: UploadService = {
  async send(study: QueuedStudy): Promise<UploadResult> {
    const token = await loadToken();

    if (token === null) {
      // Sin credencial no hay nada que intentar, y 'unauthorized' es la causa
      // exacta: la cola la trata como algo que el usuario resuelve entrando otra
      // vez, no como algo que se arregle reintentando.
      return reject('unauthorized');
    }

    const file = new File(study.imageUri);

    if (!file.exists) {
      // Reintentar esto no lo arregla nunca, asi que se distingue de un fallo de
      // red a proposito: la cola reintenta el segundo y no gasta intentos en el
      // primero.
      console.warn(`[subida] la imagen del estudio ${study.id} ya no esta en el disco`);
      return reject('unexpected');
    }

    let result;

    try {
      result = await file.upload(apiUrl('/studies/'), optionsFor(study, token, file));
    } catch (error) {
      // Degradacion, no fallo: la cola reintenta sola y el usuario lo ve en el
      // historial. Se registra igualmente porque un envio que no sale y no deja
      // rastro es indistinguible de uno que nunca se intento.
      console.warn(`[subida] el estudio ${study.id} no salio; la cola reintentara`, error);
      return reject('network-unreachable');
    }

    if (result.status < 200 || result.status >= 300) {
      return reject(reasonFrom(parsed(result.body), UPLOAD_REASONS, 'unexpected'));
    }

    const receipt = receiptFrom(parsed(result.body));

    // Un 2xx sin acuse utilizable no es un envio correcto. Darlo por bueno
    // borraria la imagen sin tener con que volver a pedirla.
    return receipt === null ? reject('unexpected') : { ok: true, value: receipt };
  },
};
