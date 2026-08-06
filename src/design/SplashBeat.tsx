import { BlurMask, Canvas, Group, Path } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

import { BEAT_PATH, BEAT_VIEWBOX } from '@/design/beatPath';
import { useBeatProgress } from '@/design/useBeatProgress';

/** Grosor del trazo en puntos de pantalla, antes de escalar al sistema del path. */
const STROKE_WIDTH = 12;
const GLOW = 18;

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
 * pruebas pueda mostrarlo en una caja y revisarlo con calma: en el arranque
 * real solo se ve durante unos ochocientos milisegundos.
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
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none" accessibilityElementsHidden>
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
