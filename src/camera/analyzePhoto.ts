import { Skia } from '@shopify/react-native-skia';
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

import {
  ANALYSIS_WIDTH_PX,
  assessQuality,
  assessResolution,
  type QualityFinding,
} from '@/camera/quality';

/**
 * Mide la calidad de una foto ya capturada.
 *
 * Es la fontanería del control de calidad: reduce, decodifica y pasa los
 * pixeles al modulo puro quality.ts, que es quien decide. Aqui no hay ningun
 * umbral ni ninguna heuristica, a proposito.
 *
 * La copia de analisis se guarda en PNG y no en JPEG. Puede parecer un detalle,
 * pero el JPEG introduce anillos alrededor de los bordes de alto contraste, que
 * es exactamente lo que mide el detector de enfoque: una foto movida
 * recomprimida a JPEG puntua mas alta de lo que le corresponde y pasaria por
 * nitida.
 */

/** Componentes por pixel que devuelve Skia al leer la imagen decodificada. */
const CHANNELS_PER_PIXEL = 4;

/**
 * Pesos de luminancia de la Rec. 709.
 *
 * Se usa luminancia y no un solo canal aunque el canal rojo apagaria la
 * retícula rosa y dejaria el trazo mas limpio. Para el enfoque interesa lo
 * contrario: la retícula milimetrada es la estructura mas fina que hay en la
 * hoja, y por tanto la que primero se pierde al desenfocar. Es el mejor testigo
 * de nitidez disponible y no conviene apagarla.
 */
const LUMA_RED = 0.2126;
const LUMA_GREEN = 0.7152;
const LUMA_BLUE = 0.0722;

/**
 * Analiza la foto y devuelve sus defectos.
 *
 * Si la lectura de pixeles no sale, no inventa: devuelve solo lo que si se pudo
 * medir, que es la resolucion. Un aviso ausente por no haber podido medir es
 * preferible a un aviso inventado, y un aviso omitido por completo seria
 * peor que ambos.
 *
 * @param uri Ruta de la foto a analizar.
 * @param capturedWidthPx Ancho del recorte a tamano real, el que se enviara.
 * @returns Los defectos encontrados, en orden de gravedad.
 */
export async function analyzePhoto(
  uri: string,
  capturedWidthPx: number,
): Promise<readonly QualityFinding[]> {
  let analysisUri: string | null = null;

  try {
    const reduced = await ImageManipulator.manipulate(uri)
      .resize({ width: ANALYSIS_WIDTH_PX })
      .renderAsync();
    const saved = await reduced.saveAsync({ format: SaveFormat.PNG });
    analysisUri = saved.uri;

    const gray = await readGrayscale(saved.uri, saved.width, saved.height);
    if (gray === null) {
      return resolutionOnly(capturedWidthPx);
    }

    return assessQuality({
      gray,
      width: saved.width,
      height: saved.height,
      capturedWidthPx,
    });
  } catch (error) {
    console.warn('[quality] no se pudo analizar la foto', error);
    return resolutionOnly(capturedWidthPx);
  } finally {
    if (analysisUri !== null) {
      discardAnalysisCopy(analysisUri);
    }
  }
}

/**
 * Decodifica la imagen y la reduce a luminancia por pixel.
 *
 * @param uri Ruta de la copia reducida.
 * @param width Ancho de la copia.
 * @param height Alto de la copia.
 * @returns La luminancia por pixel, o null si la imagen no se pudo leer.
 */
async function readGrayscale(
  uri: string,
  width: number,
  height: number,
): Promise<Uint8Array | null> {
  const data = await Skia.Data.fromURI(uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (image === null) {
    return null;
  }

  const pixels = image.readPixels();
  // readPixels puede devolver coma flotante segun el formato de color con el que
  // se decodifico. Si no llega en bytes, se prefiere no medir a interpretar mal.
  if (!(pixels instanceof Uint8Array) || pixels.length < width * height * CHANNELS_PER_PIXEL) {
    return null;
  }

  const gray = new Uint8Array(width * height);
  for (let index = 0; index < gray.length; index += 1) {
    const offset = index * CHANNELS_PER_PIXEL;
    // El respaldo a cero no llega a usarse: la longitud ya se comprobo arriba.
    // Esta porque el indice es calculado y el compilador no puede demostrarlo.
    const red = pixels[offset] ?? 0;
    const green = pixels[offset + 1] ?? 0;
    const blue = pixels[offset + 2] ?? 0;

    gray[index] = LUMA_RED * red + LUMA_GREEN * green + LUMA_BLUE * blue;
  }

  return gray;
}

function resolutionOnly(capturedWidthPx: number): readonly QualityFinding[] {
  const finding = assessResolution(capturedWidthPx);
  return finding === null ? [] : [finding];
}

/**
 * Borra la copia reducida que se creo solo para medir.
 *
 * Es una imagen de un paciente, aunque sea pequena: no se deja en cache a la
 * espera de que el sistema la limpie algun dia.
 */
function discardAnalysisCopy(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.warn('[quality] no se pudo borrar la copia de analisis', error);
  }
}
