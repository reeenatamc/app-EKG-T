import { Path, Skia, type SkPath } from '@shopify/react-native-skia';
import { useMemo } from 'react';

import { ambientGrid, opacity as opacityToken, size } from '@/design/tokens';

/**
 * Construye la reticula completa como un unico path.
 *
 * Un path con todos los segmentos cuesta bastante menos que un nodo por linea:
 * en una pantalla de telefono serian mas de trescientos nodos.
 *
 * Se usa PathBuilder y no Skia.Path.Make(): los metodos de mutacion de SkPath
 * estan obsoletos y Skia avisa de que desapareceran.
 */
function buildGridPath(width: number, height: number): SkPath {
  const builder = Skia.PathBuilder.Make();

  for (let x = ambientGrid.offset; x <= width; x += ambientGrid.step) {
    builder.moveTo(x, 0);
    builder.lineTo(x, height);
  }

  for (let y = ambientGrid.offset; y <= height; y += ambientGrid.step) {
    builder.moveTo(0, y);
    builder.lineTo(width, y);
  }

  return builder.detach();
}

interface AmbientGridProps {
  readonly width: number;
  readonly height: number;
  readonly color: string;
}

/**
 * Capa 3: reticula ambiental.
 *
 * Textura, nunca informacion. UN SOLO NIVEL, sin linea gruesa. La version
 * anterior tenia paso fino 8 y paso grueso 40 —una relacion de 1 a 5, que es
 * exactamente la del papel de electrocardiograma— y por tanto invitaba a contar
 * cuadros grandes sobre una textura que no esta calibrada. §12.5 dice que una
 * retícula de medicion esta calibrada o no existe, y con el visor de la Etapa 4
 * en escena ya hay una que si mide: la de dos niveles es vocabulario suyo.
 *
 * Sin cuadro grande no hay nada que contar. El paso es 11 a proposito: no guarda
 * relacion entera con ningun milimetro.
 *
 * Devuelve nodos Skia; el Canvas lo posee Background.
 *
 * @param width Ancho del lienzo en puntos.
 * @param height Alto del lienzo en puntos.
 * @param color Color de las lineas.
 * @returns Los nodos Skia de la reticula.
 */
export function AmbientGrid({ width, height, color }: AmbientGridProps) {
  const path = useMemo(() => buildGridPath(width, height), [width, height]);

  return (
    <Path
      path={path}
      style="stroke"
      strokeWidth={size.hairline}
      color={color}
      opacity={opacityToken.ambientGrid}
    />
  );
}
