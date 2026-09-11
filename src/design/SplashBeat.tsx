import { BlurMask, Canvas, Group, Path } from '@shopify/react-native-skia';

import { BEAT_PATH, BEAT_VIEWBOX } from '@/design/beatPath';
import { useBeatProgress } from '@/design/useBeatProgress';

/**
 * Grosor del trazo en puntos de pantalla, antes de escalar al sistema del path.
 *
 * BAJADO DE 12 A 6. El latido mide unos 300 puntos de ancho por 100 de alto, y la
 * espiga del QRS apenas cuarenta y cinco: con una pluma de doce puntos esa espiga
 * se dibujaba mas ancha que alta y salia convertida en un bloque, no en un pico.
 * El doce venia de cuando el latido vivia dentro de una tarjeta y se leia como un
 * logotipo; suelto sobre el lienzo tiene que leerse como un trazo.
 */
const STROKE_WIDTH = 6;

/**
 * Radio del resplandor.
 *
 * Proporcional al trazo, no independiente. A dieciocho puntos sobre una pluma de
 * seis, el halo pesaba el triple que la linea y emborronaba justo el detalle que
 * hace reconocible un electrocardiograma.
 */
const GLOW = 9;

/**
 * Alto que necesita el latido para un ancho dado.
 *
 * LO CALCULA EL COMPONENTE PORQUE ES QUIEN SABE DE QUE ESTA HECHO. El dibujo
 * mide 1200x400, o sea proporcion 3, pero el trazo tiene doce puntos de grosor y
 * el resplandor dieciocho mas, y eso sobresale del dibujo por arriba y por abajo.
 * Un alto calculado fuera con la proporcion a ojo recorta la espiga del QRS y la
 * deja convertida en un bloque cuadrado -- que es exactamente lo que paso al
 * sacar el latido de su tarjeta.
 *
 * @param width Ancho disponible en puntos.
 * @returns El alto que hay que darle.
 */
export function beatHeightFor(width: number): number {
  const drawn = (width * BEAT_VIEWBOX.height) / BEAT_VIEWBOX.width;

  return Math.ceil(drawn + STROKE_WIDTH + 2 * GLOW);
}

interface SplashBeatProps {
  /** Duracion del trazo, calibrada a lo que tarda el arranque real. */
  readonly durationMs: number;
  readonly width: number;
  readonly height: number;
  /**
   * Color del latido. Llega del tema, igual que en la capa 2.
   *
   * UN SOLO COLOR. Antes era el degradado salmon-rosa-lila del aurora, o sea el
   * logotipo de la aplicacion pintado con los colores de su propio fondo
   * decorativo. Es la marca: va en carmin.
   */
  readonly color: string;
}

/**
 * El latido que se dibuja una sola vez durante el arranque.
 *
 * Es la unica animacion llamativa de toda la aplicacion (§11). Se dibuja
 * recortando el path con la prop `end`, que Skia acepta como valor animado de
 * Reanimated, asi que el trazo avanza en el hilo de UI sin pasar por React.
 *
 * El tamano llega por props y no de useWindowDimensions para que el banco de
 * pruebas pueda mostrarlo en una caja y revisarlo con calma.
 *
 * EL LIENZO MIDE LO QUE SE LE DICE. Antes se estiraba con absoluteFill y las
 * medidas recibidas solo servian para calcular la escala, o sea que habia que
 * pasarle el tamano de su padre y ademas acertar. Mientras vivio dentro de una
 * tarjeta de tamano fijo coincidia; en cuanto se saco de ella, el lienzo paso a
 * ser la pantalla entera mientras el centrado seguia calculado sobre la caja
 * pequena, y el latido se fue a la parte de arriba. Un componente que recibe
 * ancho y alto y luego no los usa para medirse es una trampa esperando.
 *
 * El resplandor esta permitido aqui porque este latido es el elemento
 * decorativo de §8, no una senal diagnostica: §13 prohibe el brillo sobre el
 * trazado real, donde engorda la morfologia del QRS.
 *
 * @param durationMs Duracion del trazo en milisegundos.
 * @param width Ancho disponible en puntos.
 * @param height Alto disponible en puntos.
 * @param color Color del latido, del tema activo.
 * @returns El lienzo con el latido, o null si el path no se pudo construir.
 */
export function SplashBeat({ durationMs, width, height, color }: SplashBeatProps) {
  const progress = useBeatProgress(durationMs);

  if (BEAT_PATH === null) {
    return null;
  }

  const scale = width / BEAT_VIEWBOX.width;
  const translateY = height / 2 - (BEAT_VIEWBOX.height / 2) * scale;

  return (
    <Canvas style={{ width, height }} pointerEvents="none" accessibilityElementsHidden>
      <Group transform={[{ translateY }, { scale }]}>
        <Path
          path={BEAT_PATH}
          style="stroke"
          strokeWidth={STROKE_WIDTH / scale}
          strokeCap="round"
          color={color}
          start={0}
          end={progress}
        >
          <BlurMask blur={GLOW} style="solid" />
        </Path>
      </Group>
    </Canvas>
  );
}
