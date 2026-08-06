/**
 * Parametros de dominio de la captura.
 *
 * No son tokens de diseno: describen como se encuadra y se codifica un
 * electrocardiograma, no como se ve la interfaz. Por eso viven junto al modulo
 * de camara y no en src/design/tokens.ts.
 */

/**
 * Geometria del marco de encuadre.
 *
 * La proporcion 3:2 se aproxima a la de un electrocardiograma estandar en
 * papel, de modo que el trazado llena el marco sin margenes muertos.
 */
export const CAPTURE_FRAME = {
  aspect: { width: 3, height: 2 },
  /** Fraccion del ancho que queda libre a cada lado del marco. */
  horizontalMarginRatio: 0.06,
  /** Techo de altura para que el marco no invada los controles. */
  maxHeightRatio: 0.6,
} as const;

/**
 * Compresion del recorte final, unica codificacion a JPEG del proceso: la
 * captura entrega una referencia a la imagen nativa, no un archivo ya
 * codificado.
 *
 * Se subio de 0,90 a 0,95 al entrar la Etapa 3. El motivo: el trazo es el
 * contenido de frecuencia mas alta de la hoja, y el anillado que introduce el
 * JPEG cae justo sobre los bordes de alto contraste, o sea justo encima de la
 * senal. Cuesta bytes y los bytes importan, porque esta imagen viaja por la
 * misma conexion mala que motivo la cola; pero un lead perdido cuesta mas.
 *
 * Es un juicio, no una medida: no se ha cuantificado el efecto del anillado
 * sobre la recuperacion de senal en este proyecto. Se elige el lado de la
 * fidelidad porque la sensibilidad de la digitalizacion a la degradacion de la
 * imagen si esta demostrada.
 */
export const CROPPED_COMPRESSION = 0.95;

/**
 * Margen que se captura por fuera del marco de encuadre.
 *
 * El marco delimita lo que el usuario quiere, pero en la revision puede
 * arrastrar las esquinas, y el ajuste que mas se pide es hacia afuera: el borde
 * del papel que quedo un dedo fuera de la guia. Sin margen no habria pixeles
 * ahi que recuperar.
 *
 * No rompe la correspondencia entre marco y captura que se verifico en la
 * HU-12: la amplia de forma deliberada y conocida, y el marco original se
 * devuelve en CapturedPhoto.framedRegion para que la revision arranque
 * exactamente donde el usuario encuadro.
 */
export const CAPTURE_MARGIN_RATIO = 0.08;
