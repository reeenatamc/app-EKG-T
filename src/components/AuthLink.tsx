import { StyleSheet, Text } from 'react-native';

import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';

import { useTheme } from '@/design/theme';
import { gap, size } from '@/design/tokens';
import { type } from '@/design/type';

interface AuthLinkProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly disabled?: boolean;
}

/**
 * Enlace secundario de las pantallas de acceso.
 *
 * Existe para que las cuatro pantallas de formulario compartan area tactil y
 * tratamiento: un enlace de texto suelto suele quedarse por debajo del minimo
 * de 44 puntos de §7, y ahi es donde falla con guantes o con prisa.
 *
 * ACUSA EL DEDO, como el resto de controles. Sin esto era el unico pulsable de
 * la aplicacion que no se movia al tocarlo: los botones, los iconos, las filas
 * del historial y las pestanas ya usaban el mismo muelle, y estos enlaces se
 * habian quedado fuera. Un control que no responde se lee como un control roto,
 * y estos son la unica salida de una pantalla de acceso a otra.
 *
 * @param label Texto del enlace.
 * @param onPress Accion al pulsarlo.
 * @param disabled Impide pulsarlo mientras hay una peticion en curso.
 * @returns El enlace renderizado.
 */
export function AuthLink({ label, onPress, disabled = false }: AuthLinkProps) {
  const theme = useTheme();
  const press = usePressMotion();

  return (
    <AnimatedPressable
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      disabled={disabled}
      style={[styles.pressable, press.style]}
    >
      <Text style={[type.caption, { color: theme.textLow }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  pressable: { minHeight: size.touchTarget, justifyContent: 'center', paddingVertical: gap.sm },
});
