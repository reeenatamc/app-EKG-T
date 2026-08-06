import { Blur, Group, Paint, RadialGradient, Rect, vec } from '@shopify/react-native-skia';

import { aurora, blur as blurToken } from '@/design/tokens';

interface BlobSpec {
  /** Centro y radio en fraccion del ancho o alto, para que escale con la pantalla. */
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  readonly color: string;
}

/**
 * Tres blobs, ninguno centrado y ninguno del mismo tamano (§4).
 *
 * La irregularidad es lo que hace que se lea como atmosfera y no como degradado.
 * Eran cuatro y sobraba uno: con la malla al 42 % el cuarto solo aportaba turbio.
 *
 * EL TERCERO ESTA DEBAJO DE LA BARRA DE PESTANAS a proposito, y es la parte de
 * D.4 que no se resuelve en el vidrio sino en el fondo: un desenfoque sobre una
 * zona plana no tiene nada que ensenar. El blob mas saturado de la malla se
 * ancla justo en la banda donde flota el chrome, para que lo que el vidrio
 * muestre tenga variacion cromatica que ensenar.
 */
const BLOBS: readonly BlobSpec[] = [
  { cx: 0.16, cy: 0.1, r: 0.62, color: aurora.haze },
  { cx: 0.88, cy: 0.28, r: 0.5, color: aurora.plum },
  { cx: 0.34, cy: 0.94, r: 0.66, color: aurora.carmine },
];

interface AuroraLayerProps {
  readonly width: number;
  readonly height: number;
  /** Opacidad del conjunto. En modo Monitor baja para no competir con el trazado. */
  readonly opacity: number;
}

/**
 * Capa 1: malla radial de fondo.
 *
 * Devuelve nodos de Skia, no un Canvas propio. El Canvas lo posee Background,
 * porque §1 exige un unico lienzo por pantalla y §13 lo repite: un Canvas por
 * tarjeta es un antipatron.
 *
 * @param width Ancho del lienzo en puntos.
 * @param height Alto del lienzo en puntos.
 * @param opacity Opacidad del grupo completo.
 * @returns Los nodos Skia de la malla.
 */
export function AuroraLayer({ width, height, opacity }: AuroraLayerProps) {
  return (
    // El blur va en el layer del Group: es lo que funde las costuras entre
    // blobs. Un <Blur> hermano no hace nada y deja anillos de banding.
    <Group
      opacity={opacity}
      layer={
        <Paint>
          <Blur blur={blurToken.aurora} />
        </Paint>
      }
    >
      {BLOBS.map((blob) => (
        <Rect key={blob.color} x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(width * blob.cx, height * blob.cy)}
            r={width * blob.r}
            colors={[blob.color, `${blob.color}00`]}
          />
        </Rect>
      ))}
    </Group>
  );
}
