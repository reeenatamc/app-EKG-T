import { Path, Skia, type SkPath } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import type { GridGeometry } from '@/ecg/grid';
import { boldLineInterval } from '@/ecg/grid';
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
      <Path
        path={paths.bold}
        style="stroke"
        strokeWidth={geometry.boldStepPx < SPARSE_BELOW_PX ? size.hairline : size.gridBold}
        color={boldColor}
      />
    </>
  );
}

/** Por debajo de esto, dos lineas finas seguidas no se distinguen. */
const MIN_LEGIBLE_STEP_PX = 3;

/**
 * Por debajo de este paso entre lineas gruesas (en pixeles) la reticula de 5 mm se
 * convierte en una malla que tapa el trazo. Se dibuja entonces cada 10 mm y a un
 * pixel, como en una impresion muy reducida. La calibracion no cambia.
 */
const SPARSE_BELOW_PX = 12;

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

  // SE CUENTAN LINEAS, NO SE MIDEN RESTOS. Antes la posicion se acumulaba en
  // coma flotante y se preguntaba si su resto contra el paso grueso era casi
  // cero. Con un milimetro a 1,28 px, cinco pasos suman 6,3999... y el resto
  // devuelve 6,3999 en vez de 0: la linea se clasificaba como fina. El error se
  // acumula, asi que fallaba a rachas.
  //
  // Y no era un fallo de matiz. Cuando la retícula fina esta oculta -- que es el
  // caso a ancho de telefono -- una gruesa mal clasificada no se dibuja mas
  // delgada: no se dibuja. Medido sobre un 3x4 en un movil, 61 de 101 lineas
  // desaparecian, dejando bandas enteras de papel en blanco.
  const boldEvery = boldLineInterval(geometry) * (geometry.boldStepPx < SPARSE_BELOW_PX ? 2 : 1);

  for (let i = 0; i * geometry.smallStepPx <= width; i += 1) {
    const x = i * geometry.smallStepPx;
    const target = i % boldEvery === 0 ? bold : fine;
    target.moveTo(x, 0).lineTo(x, height);
  }

  for (let i = 0; i * geometry.smallStepPx <= height; i += 1) {
    const y = i * geometry.smallStepPx;
    const target = i % boldEvery === 0 ? bold : fine;
    target.moveTo(0, y).lineTo(width, y);
  }

  return { fine: fine.detach(), bold: bold.detach() };
}
