import { Canvas, Group, Path } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

import { TAB_ICON_PATHS, TAB_ICON_VIEWBOX, type TabIconName } from '@/components/icons/tabIcons';
import { size } from '@/design/tokens';

interface TabIconProps {
  readonly name: TabIconName;
  readonly color: string;
}

/** Lado del icono en pantalla, en puntos. */
const ICON_SIZE = 22;

/** Grosor del trazo. El mismo en los cuatro: son una familia, no cuatro dibujos. */
const STROKE_WIDTH = 1.8;

/**
 * Un icono de la barra de pestanas.
 *
 * LLEVA SU PROPIO `<Canvas>`, y eso se aparta de §1, que pide uno por pantalla.
 * La desviacion esta razonada en D-18: esa regla protege la composicion por
 * capas del fondo, donde varios lienzos superpuestos si cuestan; estos son
 * cuatro dibujos de veintidos puntos que no se animan y no vuelven a pintarse.
 * La alternativa —un unico lienzo en la barra, con los iconos colocados por
 * aritmetica— acoplaria el dibujo al reparto flexible de la barra, y ese
 * acoplamiento se rompe en cuanto cambia una pestana.
 *
 * @param name Icono a dibujar.
 * @param color Color del trazo, que viene del estado de la pestana.
 * @returns El icono.
 */
export function TabIcon({ name, color }: TabIconProps) {
  const path = TAB_ICON_PATHS[name];

  if (path === null) {
    return null;
  }

  const scale = ICON_SIZE / TAB_ICON_VIEWBOX;

  return (
    <Canvas style={styles.canvas}>
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

const styles = StyleSheet.create({
  canvas: { width: ICON_SIZE, height: ICON_SIZE, minWidth: size.hairline },
});
