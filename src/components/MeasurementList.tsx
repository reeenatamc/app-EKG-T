import { StyleSheet, Text, View } from 'react-native';

import { MEASUREMENT_LABELS } from '@/constants/studyText';
import type { EcgMeasurements } from '@/ecg/EcgAnalysisService';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { type } from '@/design/type';

interface MeasurementListProps {
  readonly measurements: EcgMeasurements;
}

/**
 * Las medidas del trazado.
 *
 * SUPERFICIE OPACA: son cifras clinicas y §12.1 no admite vidrio debajo.
 *
 * Van en la familia monoespaciada de §6, que no es una eleccion estetica: con
 * cifras de anchura fija, dos valores en columna se comparan de un vistazo
 * porque las unidades quedan alineadas. Con una proporcional, un 1 y un 8 ocupan
 * distinto y la columna baila.
 *
 * @param measurements Medidas del estudio.
 * @returns La lista de medidas.
 */
export function MeasurementList({ measurements }: MeasurementListProps) {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {Object.entries(MEASUREMENT_LABELS).map(([key, copy]) => (
        <View key={key} style={[styles.cell, { backgroundColor: theme.surface }]}>
          <Text style={[type.caption, { color: theme.textLow }]}>{copy.label}</Text>
          <Text style={[type.vital, { color: theme.textHigh }]}>
            {measurements[key as keyof EcgMeasurements]}
          </Text>
          <Text style={[type.caption, { color: theme.textLow }]}>{copy.unit}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: gap.sm },
  cell: {
    flexGrow: 1,
    flexBasis: '30%',
    padding: gap.md,
    borderRadius: radius.tile,
    gap: gap.xs,
  },
});
