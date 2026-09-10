import { StyleSheet, Text, View } from 'react-native';

import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgObservation } from '@/ecg/EcgAnalysisService';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface ObservationListProps {
  readonly observations: readonly EcgObservation[];
}

/**
 * Fraccion a porcentaje, para mostrar la confianza.
 *
 * SE TRUNCA, NO SE REDONDEA. Redondear convierte 0,996 en «100%», y eso es una
 * certeza que el modelo no ha afirmado: sus salidas no son probabilidades
 * calibradas, y ni siquiera las que lo fueran llegan al uno. Una aplicacion que
 * repite en cada fila que hay que confirmar la lectura no puede a la vez
 * escribir un cien por cien.
 */
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
 * LAS DERIVACIONES NO SE PINTAN POR FILA, y no por ahorrar sitio. El pipeline
 * las calcula una vez para la lectura entera y se las pone iguales a todas las
 * observaciones -- «which leads the reading actually rests on», dice-- porque el
 * modelo no localiza hallazgos: recibe una senal y devuelve puntuaciones, sin
 * saber en cual se ve cada cosa. Repetir las mismas tres en cada fila insinuaba
 * una diferencia que no existe. Se dicen una vez, arriba, junto al foco.
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
            {Math.floor(observation.confidence * PERCENT)}% {STUDY_TEXT.confidenceLabel}
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
