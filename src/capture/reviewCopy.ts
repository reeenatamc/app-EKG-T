import type { PhotoSource } from '@/camera/capturePhoto';
import { REVIEW_TEXT } from '@/constants/captureText';

/** Lo que cambia en la pantalla de revision segun de donde venga la imagen. */
export interface ReviewCopy {
  readonly title: string;
  readonly hint: string;
  /** Etiqueta del boton que devuelve las esquinas a su sitio de partida. */
  readonly reset: string;
}

/**
 * Titulo, instruccion y etiqueta de reinicio para una imagen de este origen.
 *
 * LA INSTRUCCION DE LA CAMARA ES DANINA EN LA GALERIA, y por eso existe esta
 * funcion. "Arrastra cada esquina hasta el borde del papel" es exactamente lo
 * que hay que hacer con una fotografia de una hoja sobre una mesa: alrededor
 * hay fondo y quitarlo ayuda. Con una imagen importada, que ya suele ser la hoja
 * entera, esa misma frase pide recortar el electrocardiograma.
 *
 * Medido sobre un registro de 1800x649: entero se identifica como `standard_3x4`
 * con un coste de 0.034, el mejor de un corpus de dieciocho imagenes; ajustado a
 * la rejilla pasa a `precordial_3x2`, y basta con quitarle la columna de texto de
 * la derecha para romperlo. El montaje decide que traza se llama que derivacion,
 * asi que eso no es perder calidad: es leer otro electrocardiograma.
 *
 * El boton de reinicio tambien cambia de nombre. "Volver al encuadre" nombra algo
 * que en la galeria no ocurrio: nadie encuadro nada, se eligio un archivo.
 *
 * @param source De donde salio la imagen.
 * @returns Los tres textos de esa variante.
 */
export function reviewCopyFor(source: PhotoSource): ReviewCopy {
  if (source === 'gallery') {
    return REVIEW_TEXT.gallery;
  }

  return { title: REVIEW_TEXT.title, hint: REVIEW_TEXT.hint, reset: REVIEW_TEXT.reset };
}
