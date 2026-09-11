import { CAPTURE_MARGIN_RATIO } from '@/camera/captureConfig';
import { computeCropRegion, type CropRegion, type Rect, type Size } from '@/camera/framing';
import { expandRect } from '@/camera/quad';
import {
  appliedTurn,
  remainingClockwise,
  turnRectCounterClockwise,
  turnSize,
  type QuarterTurn,
} from '@/camera/turn';

/** Que recortar de la foto entregada, cuanto girarlo y donde queda el marco. */
export interface CapturePlan {
  /** Region a recortar, en pixeles de la foto tal como la entrego la camara. */
  readonly region: CropRegion;
  /** Grados en sentido horario a girar el recorte para que quede derecho. */
  readonly clockwise: QuarterTurn;
  /** El marco encuadrado, en pixeles de la imagen final ya girada. */
  readonly framedRegion: Rect;
}

/**
 * Traduce el marco que se vio a lo que hay que hacer con la foto.
 *
 * EN TRES ESPACIOS, Y ESE ES TODO EL TRUCO. El marco vive en la vista previa,
 * que esta siempre en vertical. La foto puede venir girada, porque Android la
 * gira segun como se sostenia el telefono. Y la imagen final tiene que quedar
 * derecha. Se calcula todo en el espacio de la vista previa, con las mismas
 * funciones probadas de siempre, y solo al final se lleva a la foto girada: asi
 * el giro no se mezcla con la correspondencia entre pantalla y sensor, que es
 * donde ya se equivoco una vez esta pantalla.
 *
 * @param container Contenedor de la vista previa, en puntos.
 * @param frame Marco visible, en coordenadas del contenedor.
 * @param delivered Tamano de la foto tal como la entrego la camara.
 * @param expected Giro del telefono al disparar.
 * @returns El recorte, el giro pendiente y el marco en la imagen final.
 */
export function planCapture(
  container: Size,
  frame: Rect,
  delivered: Size,
  expected: QuarterTurn,
): CapturePlan {
  const applied = appliedTurn(expected, delivered);
  // La foto como la habria dado la camara sin girar: la de la vista previa.
  const upright = turnSize(delivered, applied);
  const { outer, framed } = regionsInPreview(container, frame, upright);

  const outerSize: Size = { width: outer.width, height: outer.height };
  const region = turnRectCounterClockwise(outer, upright, applied);
  const framedInCrop = turnRectCounterClockwise(framed, outerSize, applied);
  const clockwise = remainingClockwise(applied, expected);
  // Girar en horario es girar en antihorario lo que falta hasta la vuelta.
  const counterClockwise = ((360 - clockwise) % 360) as QuarterTurn;

  return {
    region: { originX: region.x, originY: region.y, width: region.width, height: region.height },
    clockwise,
    framedRegion: turnRectCounterClockwise(
      framedInCrop,
      turnSize(outerSize, applied),
      counterClockwise,
    ),
  };
}

/**
 * El recorte con su margen y el marco dentro de el, en el espacio de la vista
 * previa.
 *
 * Las dos regiones se calculan con la misma funcion probada, computeCropRegion,
 * en lugar de calcular una y deducir la otra por aritmetica: asi el margen no
 * puede introducir un desfase propio.
 *
 * @param container Contenedor de la vista previa.
 * @param frame Marco visible.
 * @param photo Tamano de la foto en el espacio de la vista previa.
 * @returns El recorte exterior y el marco relativo a el.
 */
function regionsInPreview(
  container: Size,
  frame: Rect,
  photo: Size,
): { readonly outer: Rect; readonly framed: Rect } {
  const containerBounds: Rect = { x: 0, y: 0, ...container };
  const outer = computeCropRegion({
    container,
    frame: expandRect(frame, CAPTURE_MARGIN_RATIO, containerBounds),
    photo,
  });
  const inner = computeCropRegion({ container, frame, photo });

  if (outer.wasClamped) {
    warnAboutClampedRegion(outer.region, photo);
  }

  return {
    outer: {
      x: outer.region.originX,
      y: outer.region.originY,
      width: outer.region.width,
      height: outer.region.height,
    },
    framed: {
      x: inner.region.originX - outer.region.originX,
      y: inner.region.originY - outer.region.originY,
      width: inner.region.width,
      height: inner.region.height,
    },
  };
}

/**
 * Avisa de que la region calculada no cabia en la foto.
 *
 * Que esto ocurra significa que la capa nativa no coloco la vista previa como
 * asume computeCropRegion. La captura sigue adelante con la region ajustada
 * para no bloquear al usuario, pero queda constancia porque el encuadre
 * resultante no sera el que se mostro en pantalla.
 */
function warnAboutClampedRegion(region: CropRegion, photo: Size): void {
  console.warn(
    '[framing] La region de recorte excedia los limites de la foto y se ajusto. ' +
      'El area capturada puede no coincidir con el marco en este dispositivo.',
    { regionAplicada: region, tamanoFoto: photo },
  );
}
