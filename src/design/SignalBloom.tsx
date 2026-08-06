import { BlurMask, Group, Path } from '@shopify/react-native-skia';

import { BEAT_PATH, BEAT_VIEWBOX } from '@/design/beatPath';
import { blur as blurToken, opacity as opacityToken } from '@/design/tokens';

const STROKE_WIDTH = 34;

interface SignalBloomLayerProps {
  readonly width: number;
  readonly height: number;
  /**
   * Color del latido, que llega del tema.
   *
   * Va por prop y no leyendo el tema aqui porque este componente devuelve nodos
   * de Skia dentro del lienzo de otro: el arbol de React que lo contiene es el
   * que tiene el contexto.
   */
  readonly color: string;
}

/**
 * Capa 2: el trazado difuso. Es el elemento firma del sistema.
 *
 * La malla del aurora aporta atmosfera; esta capa aporta significado. Es la
 * senal del propio paciente, ampliada y desenfocada hasta volverse ambiente.
 *
 * UN SOLO COLOR, QUE SE INVIERTE CON EL TEMA. Antes era un degradado
 * salmon-rosa-lila, exactamente los mismos tres colores que los blobs del aurora
 * que tiene detras: el elemento firma del sistema estaba pintado del color de su
 * propio fondo y no se veia. Ahora es sombra sobre hueso y resplandor sobre
 * ciruela, asi que siempre se separa de lo que hay debajo.
 *
 * Devuelve nodos Skia; el Canvas lo posee Background (§1).
 *
 * La opacidad sigue siendo la misma en ambos temas: separarla se probo y se
 * retiro por falta de evidencia (D-10). Lo que cambia es el color.
 *
 * @param width Ancho del lienzo en puntos.
 * @param height Alto del lienzo en puntos.
 * @param color Color del latido, del tema activo.
 * @returns Los nodos Skia del latido difuso, o null si el path no se pudo construir.
 */
export function SignalBloomLayer({ width, height, color }: SignalBloomLayerProps) {
  if (BEAT_PATH === null) {
    return null;
  }

  const scale = width / BEAT_VIEWBOX.width;
  const translateY = height / 2 - (BEAT_VIEWBOX.height / 2) * scale;

  return (
    <Group transform={[{ translateY }, { scale }]}>
      <Path
        path={BEAT_PATH}
        style="stroke"
        strokeWidth={STROKE_WIDTH}
        strokeCap="round"
        color={color}
        opacity={opacityToken.bloom}
      >
        <BlurMask blur={blurToken.bloom} style="normal" />
      </Path>
    </Group>
  );
}
