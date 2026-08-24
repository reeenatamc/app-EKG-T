import { Pressable, StyleSheet, Text } from 'react-native';

import { playHaptic } from '@/design/haptics';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface SegmentedOptionButtonProps {
  readonly label: string;
  readonly isActive: boolean;
  readonly onPress: () => void;
}

/**
 * Opcion individual de un control segmentado.
 *
 * El estado seleccionado se expone a accesibilidad ademas de pintarse: §12.3 no
 * admite el color como unico portador de significado.
 *
 * SE MARCA CON TINTA, no con carmin. La regla de tamano de §12.9 no permite
 * rellenar de carmin un elemento pequeno que se lee como estado, y una opcion
 * elegida es exactamente eso. La inversion tinta/lienzo es inequivoca y no gasta
 * el color de la marca.
 *
 * @param label Texto de la opcion.
 * @param isActive Cierto si es la opcion elegida.
 * @param onPress Accion al pulsarla.
 * @returns La opcion renderizada.
 */
export function SegmentedOptionButton({ label, isActive, onPress }: SegmentedOptionButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={label}
      onPress={() => {
        playHaptic('selection');
        onPress();
      }}
      style={[styles.option, isActive ? { backgroundColor: theme.textHigh } : null]}
    >
      <Text style={[type.caption, { color: isActive ? theme.canvas : theme.textHigh }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flex: 1,
    minHeight: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: gap.xs,
    borderRadius: radius.pill,
    borderCurve: 'continuous',
  },
});
