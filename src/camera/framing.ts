/**
 * Geometria del encuadre de captura.
 *
 * Todo este modulo es puro: no importa React Native ni expo-camera. Esa es la
 * razon de que exista aparte. La correspondencia entre el marco que ve el
 * usuario y el area que acaba recortada es el fallo tipico de esta pantalla, y
 * aislarla aqui permite razonarla y probarla sin un dispositivo delante.
 */

export interface Size {
  readonly width: number;
  readonly height: number;
}

export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** Region de recorte en pixeles de la foto, en el formato que espera expo-image-manipulator. */
export interface CropRegion {
  readonly originX: number;
  readonly originY: number;
  readonly width: number;
  readonly height: number;
}

export interface CropComputation {
  readonly region: CropRegion;
  /** Cierto si hubo que ajustar la region a los limites de la foto. Ver computeCropRegion. */
  readonly wasClamped: boolean;
}

export interface CropInput {
  /** Tamano del contenedor de la vista previa, en puntos. */
  readonly container: Size;
  /** Marco visible, en coordenadas del contenedor. */
  readonly frame: Rect;
  /** Tamano real de la foto capturada, en pixeles. */
  readonly photo: Size;
}

// Un recorte de menos de un pixel no es representable.
const MIN_CROP_SIZE = 1;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

/**
 * Calcula el marco de encuadre centrado dentro del contenedor.
 *
 * El ancho se deriva del margen horizontal y el alto de la proporcion pedida.
 * Si el resultado no cabe a lo alto, manda el alto disponible: es preferible un
 * marco mas estrecho que uno que se salga de la pantalla.
 *
 * @param container Tamano del contenedor de la vista previa, en puntos.
 * @param aspect Proporcion deseada del marco, por ejemplo 3:2.
 * @param horizontalMarginRatio Fraccion del ancho libre a cada lado, entre 0 y 0.5.
 * @param maxHeightRatio Fraccion maxima de la altura del contenedor que puede ocupar.
 * @returns El marco en coordenadas del contenedor.
 */
export function computeFrameRect(
  container: Size,
  aspect: Size,
  horizontalMarginRatio: number,
  maxHeightRatio: number,
): Rect {
  const widthFromMargin = container.width * (1 - 2 * horizontalMarginRatio);
  const heightFromMargin = (widthFromMargin * aspect.height) / aspect.width;
  const maximumHeight = container.height * maxHeightRatio;

  const height = Math.min(heightFromMargin, maximumHeight);
  const width = (height * aspect.width) / aspect.height;

  return {
    x: (container.width - width) / 2,
    y: (container.height - height) / 2,
    width,
    height,
  };
}

/**
 * Coloca un contenido dentro de un contenedor sin recortarlo ni deformarlo.
 *
 * Es la transformacion inversa de la que aplica computeCropRegion: alli la capa
 * nativa rellena el contenedor y recorta lo que sobra; aqui el contenido cabe
 * entero y sobra contenedor. Hace falta para saber exactamente donde acaba
 * dibujada una fotografia en modo contain, que es el espacio en el que viven
 * las cuatro esquinas de recorte.
 *
 * @param container Tamano del contenedor.
 * @param content Tamano del contenido.
 * @returns La region que ocupa el contenido, centrada en el contenedor.
 */
export function computeContainRect(container: Size, content: Size): Rect {
  if (content.width === 0 || content.height === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const scale = Math.min(container.width / content.width, container.height / content.height);
  const width = content.width * scale;
  const height = content.height * scale;

  return {
    x: (container.width - width) / 2,
    y: (container.height - height) / 2,
    width,
    height,
  };
}

/**
 * Traduce el marco visible a la region equivalente de la foto capturada.
 *
 * La capa nativa muestra la vista previa rellenando el contenedor y recortando
 * el sobrante por igual a ambos lados (resizeAspectFill en iOS, FILL_CENTER en
 * Android). Esta funcion invierte esa transformacion: reconstruye cuanto quedo
 * oculto fuera de la pantalla y desplaza el marco esa cantidad.
 *
 * Cuando la foto y el contenedor comparten proporcion, el desplazamiento es
 * cero y el calculo degrada a una escala lineal. Por eso la misma formula sirve
 * tanto si la capa nativa recorta como si no.
 *
 * @param input Contenedor, marco y tamano real de la foto.
 * @returns La region de recorte y si hubo que ajustarla a los limites.
 */
export function computeCropRegion(input: CropInput): CropComputation {
  const { container, frame, photo } = input;

  const scale = Math.max(container.width / photo.width, container.height / photo.height);
  const hiddenX = (photo.width * scale - container.width) / 2;
  const hiddenY = (photo.height * scale - container.height) / 2;

  return clampToPhoto(
    {
      originX: Math.round((frame.x + hiddenX) / scale),
      originY: Math.round((frame.y + hiddenY) / scale),
      width: Math.round(frame.width / scale),
      height: Math.round(frame.height / scale),
    },
    photo,
  );
}

/**
 * Ajusta la region a los limites de la foto.
 *
 * Que haga falta ajustar significa que el modelo de recorte centrado no se
 * cumplio en ese dispositivo. Se informa mediante wasClamped en vez de fallar,
 * porque el usuario debe poder capturar igualmente.
 */
function clampToPhoto(region: CropRegion, photo: Size): CropComputation {
  const originX = clamp(region.originX, 0, Math.max(0, photo.width - MIN_CROP_SIZE));
  const originY = clamp(region.originY, 0, Math.max(0, photo.height - MIN_CROP_SIZE));
  const width = clamp(region.width, MIN_CROP_SIZE, photo.width - originX);
  const height = clamp(region.height, MIN_CROP_SIZE, photo.height - originY);

  const wasClamped =
    originX !== region.originX ||
    originY !== region.originY ||
    width !== region.width ||
    height !== region.height;

  return { region: { originX, originY, width, height }, wasClamped };
}
