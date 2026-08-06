import { Path, Skia, type SkPath } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import type { GridGeometry } from '@/ecg/grid';
import { size } from '@/design/tokens';

interface MeasuringGridProps {
  readonly width: number;
  readonly height: number;
  readonly geometry: GridGeometry;
  readonly fineColor: string;
  readonly boldColor: string;
}

/**
 * Retícula de medicion calibrada, segun SKILL.md §9.
 *
 * NO ES LA RETICULA AMBIENTAL de `design/AmbientGrid.tsx`, y la separacion es
 * deliberada. Aquella es textura: sus pasos no corresponden a milimetros, su
 * desfase es irregular a proposito y su unico fin es que el fondo no sea plano.
 * Esta se puede medir: un cuadro pequeno vale 0,04 s y 0,1 mV a la calibracion
 * estandar, y `grid.test.ts` comprueba que esa correspondencia se mantiene
 * contra la escala a la que se dibuja el trazado.
 *
 * Compartir componente entre las dos seria el error: bastaria con que alguien
 * ajustase el paso de la ambiental por gusto estetico para que la de medicion
 * dejase de medir, sin que nada fallase.
 *
 * @param width Ancho de la region a cubrir.
 * @param height Alto de la region a cubrir.
 * @param geometry Pasos de la retícula, derivados de la calibracion.
 * @param fineColor Color de las lineas de un milimetro.
 * @param boldColor Color de las lineas de cinco milimetros.
 * @returns La retícula de medicion.
 */
export function MeasuringGrid({
  width,
  height,
  geometry,
  fineColor,
  boldColor,
}: MeasuringGridProps) {
  // Los dos caminos se construyen una vez por tamano y por calibracion. Son
  // cientos de segmentos, y rehacerlos en cada render los convertiria en el
  // coste dominante de la pantalla.
  const paths = useMemo(() => buildGridPaths(width, height, geometry), [width, height, geometry]);

  // Con el registro entero en pantalla, un milimetro cae por debajo del pixel y
  // las lineas finas se convierten en una mancha gris que no se puede contar.
  // Se ocultan y quedan las de cinco milimetros, que es exactamente lo que se ve
  // en una impresion reducida. La escala NO cambia: sigue derivada de los
  // pixeles por milimetro reales, asi que lo que se oculta es una linea
  // ilegible, no la calibracion.
  const showFine = geometry.smallStepPx >= MIN_LEGIBLE_STEP_PX;

  return (
    <>
      {showFine ? (
        <Path path={paths.fine} style="stroke" strokeWidth={size.hairline} color={fineColor} />
      ) : null}
      <Path path={paths.bold} style="stroke" strokeWidth={size.gridBold} color={boldColor} />
    </>
  );
}

/** Por debajo de esto, dos lineas finas seguidas no se distinguen. */
const MIN_LEGIBLE_STEP_PX = 3;

interface GridPaths {
  readonly fine: SkPath;
  readonly bold: SkPath;
}

/**
 * Construye los dos caminos de la retícula.
 *
 * Las lineas gruesas se dibujan en su propio camino en lugar de repetirse sobre
 * las finas: superponerlas dejaria un borde mas oscuro a cada lado, que a esta
 * escala se ve como una linea doble.
 *
 * @param width Ancho de la region.
 * @param height Alto de la region.
 * @param geometry Pasos de la retícula.
 * @returns Los caminos fino y grueso.
 */
function buildGridPaths(width: number, height: number, geometry: GridGeometry): GridPaths {
  const fine = Skia.PathBuilder.Make();
  const bold = Skia.PathBuilder.Make();

  const isBold = (position: number): boolean =>
    Math.abs(position % geometry.boldStepPx) < HALF_PIXEL;

  for (let x = 0; x <= width; x += geometry.smallStepPx) {
    const target = isBold(x) ? bold : fine;
    target.moveTo(x, 0).lineTo(x, height);
  }

  for (let y = 0; y <= height; y += geometry.smallStepPx) {
    const target = isBold(y) ? bold : fine;
    target.moveTo(0, y).lineTo(width, y);
  }

  return { fine: fine.detach(), bold: bold.detach() };
}

/** Tolerancia al comparar posiciones acumuladas en coma flotante. */
const HALF_PIXEL = 0.5;
