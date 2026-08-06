import { Pressable, StyleSheet, Text } from 'react-native';

import { useTheme } from '@/design/theme';
import { brand, gap, opacity, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

/**
 * Papel del boton.
 *
 * - `primary` rellena de carmin. Es la accion principal y ocupa el ancho
 *   completo, o sea una superficie grande: es una de las tres excepciones de la
 *   regla de tamano de §12.9.
 * - `secondary` es contorno de tinta.
 * - `onBrand` es la accion principal **cuando ya esta sobre carmin**, como
 *   dentro del modulo hero del inicio. Se invierte a relleno hueso con
 *   etiqueta carmin, porque carmin sobre carmin no seria un boton.
 */
export type ActionButtonVariant = 'primary' | 'secondary' | 'onBrand';

interface ActionButtonProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly variant: ActionButtonVariant;
  /** Impide pulsarlo dos veces mientras una peticion esta en curso. */
  readonly disabled?: boolean;
}

/**
 * Boton de accion de la aplicacion.
 *
 * EL ACENTO PRIMARIO ES `brand.carmine`, no un blob del aurora. Hasta el
 * rediseno era `aurora.rose`, que ademas era el color de la niebla del fondo:
 * medido en D.1, ese rosa contra `semantic.alarmHigh` daba 1.70:1, asi que lo
 * unico que separaba «boton de marca» de «alarma critica» era la saturacion del
 * tono. El carmin profundo esta en 2.15:1 y, sobre todo, es mucho mas oscuro: a
 * simple vista lee como tinta, y el rojo de alarma como luz de aviso. La
 * separacion la remata la regla de tamano de §12.9.
 *
 * El borde `brand.edge` no es decorativo: da al relleno un limite de 3.8:1
 * contra el lienzo en ambos temas, que es lo que pide la WCAG 1.4.11 para el
 * contorno de un control.
 *
 * El estado pulsado lo resuelve la funcion de estilo de Pressable, en el hilo
 * nativo, para que la respuesta no dependa de un renderizado de React.
 *
 * @param label Texto visible del boton.
 * @param onPress Accion a ejecutar al pulsarlo.
 * @param variant Papel del boton.
 * @param disabled Cierto mientras la accion esta en curso.
 * @returns El boton renderizado.
 */
export function ActionButton({ label, onPress, variant, disabled = false }: ActionButtonProps) {
  const theme = useTheme();

  const surface = {
    primary: { backgroundColor: brand.carmine, borderColor: brand.edge },
    secondary: { backgroundColor: 'transparent', borderColor: theme.textHigh },
    onBrand: { backgroundColor: brand.onCarmine, borderColor: brand.onCarmine },
  }[variant];

  const labelColor = {
    primary: brand.onCarmine,
    secondary: theme.textHigh,
    onBrand: brand.carmine,
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        surface,
        pressed ? styles.pressed : null,
        disabled ? styles.disabled : null,
      ]}
    >
      <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    minHeight: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: gap.md,
    paddingHorizontal: gap.xl,
    // Pildora, no chip. Es el rasgo mas constante de las referencias de `inspo/`:
    // en las seis, la accion principal es una pildora a ancho completo.
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    borderWidth: size.hairline,
  },
  pressed: { opacity: opacity.pressed },
  disabled: { opacity: opacity.disabled },
  label: { ...type.body, fontFamily: 'Inter_500Medium' },
});
