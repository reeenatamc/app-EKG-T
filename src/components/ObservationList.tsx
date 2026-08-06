import { StyleSheet, Text, View } from 'react-native';

import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgObservation } from '@/ecg/EcgAnalysisService';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface ObservationListProps {
  readonly observations: readonly EcgObservation[];
}

/** Fraccion a porcentaje, para mostrar la confianza. */
const PERCENT = 100;

/**
 * Lo que el modelo observo en el trazado.
 *
 * NO SON DIAGNOSTICOS y la pantalla no deja lugar a dudas: el aviso de que esto
 * es una lectura automatica va arriba, cada observacion lleva escrito que
 * requiere confirmacion, y ninguna se pinta con color de estado. Un rojo o un
 * verde aqui convertirian una sugerencia en un veredicto, ademas de invadir la
 * paleta de alarma de §12.
 *
 * La confianza se muestra porque una observacion al 60% y otra al 95% no piden
 * la misma atencion, y ocultarlo seria decidir por el clinico.
 *
 * @param observations Observaciones del analisis.
 * @returns La lista de observaciones.
 */
export function ObservationList({ observations }: ObservationListProps) {
  const theme = useTheme();

  if (observations.length === 0) {
    return <Text style={[type.body, { color: theme.textLow }]}>{STUDY_TEXT.noObservations}</Text>;
  }

  return (
    <View style={styles.list}>
      {observations.map((observation) => (
        <View
          key={observation.id}
          style={[
            styles.item,
            // Acento decorativo, no color de estado. Ver la cabecera del
            // componente. Es retícula gruesa: ni marca ni alarma.
            { backgroundColor: theme.surface, borderLeftColor: theme.gridBold },
          ]}
          accessibilityLabel={`${observation.label}. ${STUDY_TEXT.observationNeedsReview}.`}
        >
          <Text style={[type.body, { color: theme.textHigh }]}>{observation.label}</Text>

          <Text style={[type.caption, { color: theme.textLow }]}>
            {observation.leads.join(' · ')} — {Math.round(observation.confidence * PERCENT)}%{' '}
            {STUDY_TEXT.confidenceLabel}
          </Text>

          <Text style={[type.caption, { color: theme.textHigh }]}>
            {STUDY_TEXT.observationNeedsReview}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: gap.sm },
  item: {
    padding: gap.lg,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    borderLeftWidth: size.frameBorder,
    gap: gap.xs,
  },
});
