import { Canvas, Group, Path, type SkPath } from '@shopify/react-native-skia';

import { size } from '@/design/tokens';

interface LineIconProps {
  /** Camino ya construido. Null cuando el SVG de origen no se pudo interpretar. */
  readonly path: SkPath | null;
  readonly color: string;
  /** Lado del sistema de coordenadas en que esta dibujado el camino. */
  readonly viewBox: number;
  /** Lado del icono en pantalla, en puntos. */
  readonly side: number;
}

/**
 * Grosor del trazo.
 *
 * El mismo en todos los iconos de la aplicacion: son una familia, no dibujos
 * sueltos, y el grosor es lo primero que delata que dos iconos vienen de sitios
 * distintos.
 */
const STROKE_WIDTH = 1.8;

/**
 * Dibuja un icono lineal.
 *
 * LLEVA SU PROPIO `<Canvas>`, y eso se aparta de §1, que pide uno por pantalla.
 * La desviacion esta razonada en D-18: esa regla protege la composicion por
 * capas del fondo, donde varios lienzos superpuestos si cuestan; estos son
 * dibujos de veintitantos puntos que no se animan y no vuelven a pintarse.
 *
 * EXISTE PARA QUE HAYA UNA SOLA FORMA DE DIBUJAR UN ICONO. Antes este cuerpo
 * vivia dentro de `TabIcon`, o sea que el segundo juego de iconos —los de
 * navegacion— habria tenido que copiarlo, y dos copias del escalado y del trazo
 * son dos sitios donde el grosor puede divergir sin que nadie lo note.
 *
 * El grosor se divide por la escala para que el trazo mida lo mismo en pantalla
 * sea cual sea el tamano pedido: el `Group` escala tambien la pluma.
 *
 * @param path Camino a dibujar, o null si no se pudo construir.
 * @param color Color del trazo. Lo decide quien llama.
 * @param viewBox Lado de la rejilla en que se dibujo el camino.
 * @param side Lado del icono en pantalla.
 * @returns El icono, o nada si el camino no existe.
 */
export function LineIcon({ path, color, viewBox, side }: LineIconProps) {
  if (path === null) {
    return null;
  }

  const scale = side / viewBox;

  return (
    <Canvas style={{ width: side, height: side, minWidth: size.hairline }}>
      <Group transform={[{ scale }]}>
        <Path
          path={path}
          style="stroke"
          strokeWidth={STROKE_WIDTH / scale}
          strokeJoin="round"
          strokeCap="round"
          color={color}
        />
      </Group>
    </Canvas>
  );
}
