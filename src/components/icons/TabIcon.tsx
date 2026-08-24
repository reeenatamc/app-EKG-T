import { LineIcon } from '@/components/icons/LineIcon';
import { TAB_ICON_PATHS, TAB_ICON_VIEWBOX, type TabIconName } from '@/components/icons/tabIcons';

interface TabIconProps {
  readonly name: TabIconName;
  readonly color: string;
}

/** Lado del icono en pantalla, en puntos. */
const ICON_SIZE = 22;

/**
 * Un icono de la barra de pestanas.
 *
 * Solo elige el camino y el tamano; dibujar es cosa de `LineIcon`, que es la
 * unica forma que tiene la aplicacion de pintar un icono.
 *
 * @param name Icono a dibujar.
 * @param color Color del trazo, que viene del estado de la pestana.
 * @returns El icono.
 */
export function TabIcon({ name, color }: TabIconProps) {
  return (
    <LineIcon
      path={TAB_ICON_PATHS[name]}
      color={color}
      viewBox={TAB_ICON_VIEWBOX}
      side={ICON_SIZE}
    />
  );
}
