import { StyleSheet, Text, View } from 'react-native';

import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgObservation } from '@/ecg/EcgAnalysisService';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';
import {
  groupByCategory,
  isShownObservation,
  observationLabel,
  type ObservationGroup,
} from '@/constants/labelsEs';

interface ObservationListProps {
  readonly observations: readonly EcgObservation[];
}

/**
 * Fraccion a porcentaje, para mostrar la confianza.
 *
 * SE TRUNCA, NO SE REDONDEA. Redondear convierte 0,996 en «100%», y eso es una
 * certeza que el modelo no ha afirmado: sus salidas no son probabilidades
 * calibradas, y ni siquiera las que lo fueran llegan al uno. Una aplicacion que
 * pide confirmar la lectura no puede a la vez escribir un cien por cien.
 */
const PERCENT = 100;

/**
 * Lo que el modelo observo en el trazado.
 *
 * NO SON DIAGNOSTICOS y la pantalla no deja lugar a dudas: el aviso de que esto
 * es una lectura automatica va arriba, la lista dice que todas requieren
 * confirmacion, y ninguna se pinta con color de estado. Un rojo o un verde aqui
 * convertirian una sugerencia en un veredicto, ademas de invadir la paleta de
 * alarma de §12.
 *
 * UNA TABLA, NO UNA TARJETA POR OBSERVACION. Eran tarjetas de tres lineas y la
 * tercera repetia «Requiere confirmacion» en todas: una lectura corriente trae
 * diez observaciones y ocupaba cuatro pantallas de desplazamiento, con la misma
 * advertencia diez veces, que a la tercera ya no se lee. Ahora es una fila por
 * observacion —el hallazgo a la izquierda, la confianza a la derecha en
 * monoespaciada, para que las cifras se lean en columna— y la advertencia va una
 * vez, encima. Cada fila la sigue diciendo a quien la recorre con lector de
 * pantalla, que no ve la cabecera.
 *
 * LAS DERIVACIONES NO SE PINTAN POR FILA. El pipeline las calcula una vez para la
 * lectura entera y se las pone iguales a todas las observaciones, porque el
 * modelo no localiza hallazgos. Repetirlas insinuaria una diferencia que no
 * existe; se dicen una vez, arriba, junto al foco.
 *
 * La confianza se muestra porque una observacion al 60% y otra al 95% no piden la
 * misma atencion, y ocultarlo seria decidir por el clinico.
 *
 * AGRUPADA POR CATEGORIA CLINICA, no en el orden en que llega. `groupByCategory`
 * decide el orden y los rotulos; aqui solo se dibuja lo que devuelve, una tabla
 * por grupo no vacio. `resumen` no forma grupo -- la agrupacion respeta la misma
 * regla que ya aplicaba HIDDEN_LABELS a esos enunciados de alcance global.
 *
 * @param observations Observaciones del analisis.
 * @returns La lista de observaciones.
 */
export function ObservationList({ observations }: ObservationListProps) {
  const theme = useTheme();

  if (observations.length === 0) {
    return <Text style={[type.body, { color: theme.textLow }]}>{STUDY_TEXT.noObservations}</Text>;
  }

  const shown = observations.filter((observation) => isShownObservation(observation.label));
  const groups = groupByCategory(shown);

  return (
    <View style={styles.block}>
      <Text style={[type.caption, { color: theme.textHigh }]}>
        {STUDY_TEXT.observationsReviewAll}
      </Text>
      {groups.map((group) => (
        <ObservationGroupTable key={group.category} group={group} />
      ))}
    </View>
  );
}

/** Rotulo de la categoria y su tabla de observaciones. */
function ObservationGroupTable({ group }: { readonly group: ObservationGroup }) {
  const theme = useTheme();

  return (
    <View style={styles.group}>
      {/* Misma micro-etiqueta que SettingsSection, un escalon mas adentro: dice
          "esto es un grupo", no "esto es la seccion". */}
      <Text style={[type.eyebrow, { color: theme.textLow }]}>{group.title}</Text>
      <View style={[styles.table, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
        {group.observations.map((observation, index) => (
          <ObservationRow key={observation.id} observation={observation} isFirst={index === 0} />
        ))}
      </View>
    </View>
  );
}

/** Una fila: el hallazgo y su confianza, separada de la anterior por un filo. */
function ObservationRow({
  observation,
  isFirst,
}: {
  readonly observation: EcgObservation;
  readonly isFirst: boolean;
}) {
  const theme = useTheme();
  const percent = Math.floor(observation.confidence * PERCENT);

  return (
    <View
      accessible
      accessibilityLabel={`${observation.label}. ${percent}% ${STUDY_TEXT.confidenceLabel}. ${STUDY_TEXT.observationNeedsReview}.`}
      style={[
        styles.row,
        isFirst ? null : { borderTopColor: theme.edge, borderTopWidth: size.hairline },
      ]}
    >
      <Text style={[type.body, styles.label, { color: theme.textHigh }]}>
        {observationLabel(observation.label)}
      </Text>
      <Text style={[type.data, { color: theme.textLow }]}>{percent} %</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: gap.lg },
  group: { gap: gap.sm },
  table: {
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    borderWidth: size.hairline,
    overflow: 'hidden',
  },
  row: {
    minHeight: size.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.md,
    paddingHorizontal: gap.lg,
    paddingVertical: gap.md,
  },
  label: { flex: 1 },
});
