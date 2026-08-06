import { StyleSheet, View } from 'react-native';

import { SegmentedOptionButton } from '@/components/SegmentedOption';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';

export interface SegmentedOption<T> {
  readonly value: T;
  readonly label: string;
}

interface SegmentedControlProps<T> {
  readonly options: readonly SegmentedOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly accessibilityLabel: string;
}

/**
 * Selector de una opcion entre varias.
 *
 * Se apoya en superficie opaca: un control sobre vidrio pierde contraste justo
 * cuando el usuario necesita leer cual esta activo.
 *
 * @param options Opciones disponibles.
 * @param value Opcion seleccionada.
 * @param onChange Se invoca con la opcion elegida.
 * @param accessibilityLabel Nombre del grupo, para lectores de pantalla.
 * @returns El selector renderizado.
 */
export function SegmentedControl<T extends string | null>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const theme = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      // La pista va HUNDIDA, en hueso en sombra, y el pulgar elevado encima. Es
      // la gramatica de un control segmentado de iOS y es lo que hace que se lea
      // como «una de estas», y no como tres botones sueltos.
      style={[styles.group, { backgroundColor: theme.canvas }]}
    >
      {options.map((option) => (
        <SegmentedOptionButton
          key={option.label}
          label={option.label}
          isActive={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    flexDirection: 'row',
    padding: gap.xs,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
    gap: gap.xs,
  },
});
