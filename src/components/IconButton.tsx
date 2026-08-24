import { StyleSheet } from 'react-native';

import { LineIcon } from '@/components/icons/LineIcon';
import { NAV_ICON_PATHS, NAV_ICON_VIEWBOX, type NavIconName } from '@/components/icons/navIcons';
import { radius, size } from '@/design/tokens';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';

interface IconButtonProps {
  readonly icon: NavIconName;
  /**
   * Lo que anuncia un lector de pantalla.
   *
   * Obligatorio, no opcional: un icono sin etiqueta es un boton mudo, y §12.3
   * no admite que el significado viaje solo en la forma.
   */
  readonly label: string;
  readonly onPress: () => void;
  /** Tinta del glifo. */
  readonly color: string;
  /** Velo bajo el glifo. */
  readonly background: string;
}

/** Lado del glifo dentro del area tactil. */
const GLYPH_SIZE = 20;

/**
 * Boton redondo de un solo icono, para salir de una pantalla.
 *
 * LOS COLORES LLEGAN POR PROP y no salen del tema. Es el mismo criterio que
 * `TileGlow`: este boton no decide nada, decide quien lo monta. Y hace falta que
 * sea asi porque sus dos usos viven en paletas distintas —la cabecera va con el
 * tema activo, la capa de camara va con los colores oscuros fijos de §12— y un
 * `useTheme()` aqui dentro pintaria el aspa de la camara con el tema claro sobre
 * una imagen en vivo.
 *
 * El area tactil es la de §7 completa aunque el glifo mida veinte puntos: lo que
 * se toca es el circulo, no el dibujo.
 *
 * Se hunde al tocarlo, con el muelle unico de §11 y en el hilo de interfaz: es
 * el mismo gesto que hace `ActionButton`, y en un boton de salida importa mas
 * que en ningun otro que se note que el toque llego.
 *
 * @param icon Glifo a dibujar.
 * @param label Etiqueta accesible.
 * @param onPress Accion al pulsarlo.
 * @param color Tinta del glifo.
 * @param background Velo bajo el glifo.
 * @returns El boton renderizado.
 */
export function IconButton({ icon, label, onPress, color, background }: IconButtonProps) {
  const press = usePressMotion();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.button, { backgroundColor: background }, press.style]}
    >
      <LineIcon
        path={NAV_ICON_PATHS[icon]}
        color={color}
        viewBox={NAV_ICON_VIEWBOX}
        side={GLYPH_SIZE}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.touchTarget,
    height: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
  },
});
