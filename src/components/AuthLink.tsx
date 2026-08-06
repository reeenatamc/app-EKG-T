import { Pressable, StyleSheet, Text } from 'react-native';

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
 * @param label Texto del enlace.
 * @param onPress Accion al pulsarlo.
 * @param disabled Impide pulsarlo mientras hay una peticion en curso.
 * @returns El enlace renderizado.
 */
export function AuthLink({ label, onPress, disabled = false }: AuthLinkProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={styles.pressable}
    >
      <Text style={[type.caption, { color: theme.textLow }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { minHeight: size.touchTarget, justifyContent: 'center', paddingVertical: gap.sm },
});
