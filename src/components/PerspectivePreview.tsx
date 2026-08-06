import {
  Canvas,
  Group,
  Image as SkiaImage,
  useImage,
  type SkImage,
} from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { Rect, Size } from '@/camera/framing';
import { quadToQuad, type Matrix3x3 } from '@/camera/homography';
import { estimateRectifiedSize, rectToQuad, type Quad } from '@/camera/quad';
import { REVIEW_TEXT } from '@/constants/captureText';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { type } from '@/design/type';

interface PerspectivePreviewProps {
  readonly uri: string;
  /** Esquinas del papel, en el mismo espacio en que se dibuja sourceBounds. */
  readonly quad: Quad;
  /** Region donde se dibuja la imagen de origen. */
  readonly sourceBounds: Rect;
  /** Ancho disponible para la previsualizacion. */
  readonly availableWidth: number;
}

/**
 * Altura maxima de la previsualizacion.
 *
 * Deliberadamente pequena. Quien manda en esta pantalla es la imagen con las
 * esquinas encima, que es donde se trabaja; esto es una comprobacion, y una
 * comprobacion que le robe sitio al trabajo esta mal dimensionada.
 */
const MAX_PREVIEW_HEIGHT = 140;

/**
 * Muestra como quedara el registro una vez enderezado.
 *
 * ESTO ES SOLO UNA PREVISUALIZACION, y esa distincion es la decision central de
 * la etapa. La imagen que se envia NO lleva la perspectiva aplicada: viaja tal
 * cual, con las cuatro esquinas como metadato. Enderezarla aqui obligaria a
 * remuestrearla sobre una GPU de gama media, y el remuestreo es exactamente
 * donde se pierde un trazo de un milimetro de ancho. El servidor la endereza
 * sobre la resolucion nativa, con herramientas que no pierden ese detalle.
 *
 * Lo que se ve aqui, por tanto, es una promesa dibujada: sirve para que el
 * usuario compruebe que ha puesto las esquinas donde debia, no para producir el
 * archivo.
 *
 * No se actualiza durante el arrastre, sino al soltar. Es mas barato y ademas
 * es lo que se mira: mientras se arrastra se miran las esquinas.
 *
 * @param uri Ruta de la foto.
 * @param quad Esquinas del papel.
 * @param sourceBounds Region donde se dibuja la imagen de origen.
 * @param availableWidth Ancho disponible.
 * @returns La previsualizacion enderezada.
 */
export function PerspectivePreview({
  uri,
  quad,
  sourceBounds,
  availableWidth,
}: PerspectivePreviewProps) {
  const theme = useTheme();
  const image = useImage(uri);

  const layout = useMemo(() => computeLayout(quad, availableWidth), [quad, availableWidth]);
  const matrix = useMemo(
    () => quadToQuad(quad, rectToQuad({ x: 0, y: 0, ...layout })),
    [quad, layout],
  );

  return (
    <View style={styles.container}>
      <Text style={[type.caption, { color: theme.textLow }]}>{REVIEW_TEXT.preview}</Text>

      <View style={[styles.frame, { backgroundColor: theme.surface }]}>
        <RectifiedCanvas image={image} matrix={matrix} source={sourceBounds} layout={layout} />
      </View>
    </View>
  );
}

interface RectifiedCanvasProps {
  readonly image: SkImage | null;
  readonly matrix: Matrix3x3 | null;
  readonly source: Rect;
  readonly layout: Size;
}

/**
 * Dibuja la imagen a traves de la homografia.
 *
 * La imagen se pinta en el mismo sistema de coordenadas en que se eligieron las
 * esquinas, y es la matriz la que lleva ese espacio al del lienzo. Hacerlo asi
 * evita tener que convertir las esquinas antes de dibujar, que es donde se
 * cuelan los desfases.
 */
function RectifiedCanvas({ image, matrix, source, layout }: RectifiedCanvasProps) {
  if (image === null || matrix === null) {
    return null;
  }

  return (
    <Canvas style={layout}>
      <Group matrix={matrix}>
        <SkiaImage
          image={image}
          x={source.x}
          y={source.y}
          width={source.width}
          height={source.height}
          fit="fill"
        />
      </Group>
    </Canvas>
  );
}

/**
 * Calcula el tamano de la previsualizacion respetando la forma estimada del papel.
 *
 * @param quad Esquinas del papel.
 * @param availableWidth Ancho disponible.
 * @returns Ancho y alto de la previsualizacion.
 */
function computeLayout(quad: Quad, availableWidth: number): Size {
  const rectified = estimateRectifiedSize(quad);
  if (rectified.width === 0 || rectified.height === 0) {
    return { width: availableWidth, height: MAX_PREVIEW_HEIGHT };
  }

  const aspect = rectified.width / rectified.height;
  const height = Math.min(availableWidth / aspect, MAX_PREVIEW_HEIGHT);

  return { width: height * aspect, height };
}

const styles = StyleSheet.create({
  container: { gap: gap.sm },
  frame: {
    borderRadius: radius.tile,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: gap.xl,
  },
});
