import { getAppEnvironment } from '@/config/env';

/**
 * Transporte HTTP contra api-EKG.
 *
 * Este modulo no sabe nada de electrocardiogramas ni de sesiones: envia, espera
 * y devuelve lo que llego. Quien traduce eso a un motivo de fallo del contrato
 * es cada adaptador, porque el vocabulario de motivos es distinto en cada uno.
 *
 * LA UNICA DECISION QUE SI TOMA AQUI es distinguir "el servidor contesto algo"
 * de "no hubo servidor". Son cosas distintas para el usuario: la primera se
 * cuenta, la segunda se reintenta. `fetch` las mezcla, porque rechaza la
 * promesa igual si no hay red que si la URL esta mal escrita.
 */

/** Cuanto se espera antes de dar la peticion por perdida. */
const TIMEOUT_MS = 15_000;

/**
 * No hubo respuesta: sin red, servidor apagado, o tardo demasiado.
 *
 * Es una clase y no un motivo suelto para que ningun adaptador pueda confundir
 * "el servidor dijo que no" con "no llegue al servidor".
 */
export class NetworkUnreachableError extends Error {
  constructor(cause?: unknown) {
    super('no se pudo contactar con el servidor');
    this.name = 'NetworkUnreachableError';
    this.cause = cause;
  }
}

export interface HttpResponse {
  readonly status: number;
  /** Cuerpo ya interpretado, o null si venia vacio o no era JSON. */
  readonly body: unknown;
}

export interface HttpRequest {
  readonly method?: 'GET' | 'POST';
  /** Credencial de sesion, si la peticion la necesita. */
  readonly token?: string | null;
  /** Cuerpo JSON. Excluyente con `form`. */
  readonly json?: unknown;
  /** Cuerpo multipart, para subir archivos. Excluyente con `json`. */
  readonly form?: FormData;
}

/**
 * Une la base con la ruta sin depender de si alguna trae barra.
 *
 * `.env` se escribe a mano y acaba con barra la mitad de las veces; una URL con
 * doble barra no falla de forma visible, responde 404 y parece que el endpoint
 * no existe.
 *
 * Se exporta porque la subida de imagenes no pasa por `httpRequest`: la hace el
 * modulo nativo de archivos, que necesita la URL ya compuesta. La direccion del
 * servidor sigue resolviendose en un unico sitio.
 *
 * @param path Ruta relativa, con o sin barra inicial.
 * @returns La URL absoluta del endpoint.
 */
export function apiUrl(path: string): string {
  const base = getAppEnvironment().apiBaseUrl.replace(/\/+$/, '');
  return `${base}/${path.replace(/^\/+/, '')}`;
}

/**
 * Interpreta el cuerpo de una respuesta, sin exigir que haya uno.
 *
 * Un 204 no trae nada y un error del servidor puede traer HTML. Ninguno de los
 * dos es motivo para tratar la respuesta como inexistente: el codigo de estado ya
 * dice lo esencial, y el adaptador decide con el.
 *
 * @param response Respuesta recibida.
 * @returns El cuerpo interpretado, o null si venia vacio o no era JSON.
 */
async function readBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    return text.length > 0 ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

/**
 * Realiza una peticion y devuelve lo que respondio el servidor.
 *
 * No lanza por codigos de error HTTP: un 401 o un 400 son respuestas y el
 * adaptador querra leer su cuerpo para saber el motivo. Solo lanza cuando no
 * hubo respuesta en absoluto.
 *
 * @param path Ruta relativa, con o sin barra inicial.
 * @param request Metodo, credencial y cuerpo.
 * @returns El codigo de estado y el cuerpo interpretado.
 * @throws {NetworkUnreachableError} Si no hubo respuesta o se agoto el tiempo.
 */
export async function httpRequest(path: string, request: HttpRequest = {}): Promise<HttpResponse> {
  const { method = 'GET', token = null, json, form } = request;

  const headers: Record<string, string> = { Accept: 'application/json' };

  if (token !== null) {
    headers.Authorization = `Token ${token}`;
  }

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // multipart NO lleva Content-Type escrito a mano: fetch tiene que ponerlo el,
  // porque incluye el separador que genera al construir el cuerpo.

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(apiUrl(path), {
      method,
      headers,
      body: json !== undefined ? JSON.stringify(json) : form,
      signal: controller.signal,
    });
  } catch (error) {
    throw new NetworkUnreachableError(error);
  } finally {
    clearTimeout(timeout);
  }

  return { status: response.status, body: await readBody(response) };
}

/**
 * Extrae el motivo que devuelve api-EKG en sus rechazos.
 *
 * El servidor contesta `{"reason": "..."}` con una palabra del vocabulario
 * compartido. Se comprueba contra el conjunto que la pantalla sabe contar: un
 * motivo desconocido, o una respuesta sin motivo, se degrada al de reserva en
 * lugar de llegar a la interfaz y renderizarse como texto generico sin que
 * nadie se entere.
 *
 * @param body Cuerpo de la respuesta.
 * @param known Motivos que el contrato admite.
 * @param fallback Motivo a usar si no hay ninguno reconocible.
 * @returns Un motivo del conjunto `known`.
 */
export function reasonFrom<T extends string>(body: unknown, known: readonly T[], fallback: T): T {
  if (typeof body !== 'object' || body === null) {
    return fallback;
  }

  const reason: unknown = (body as { reason?: unknown }).reason;

  if (typeof reason !== 'string') {
    return fallback;
  }

  const match = known.find((candidate) => candidate === reason);

  if (match === undefined) {
    console.warn(`[net] motivo no reconocido del servidor: ${reason}`);
    return fallback;
  }

  return match;
}
