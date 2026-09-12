import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LineIcon } from '@/components/icons/LineIcon';
import { NAV_ICON_PATHS, NAV_ICON_VIEWBOX } from '@/components/icons/navIcons';
import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgObservation } from '@/ecg/EcgAnalysisService';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';
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

/** Decimales de la puntuacion cruda del modelo, en el detalle. */
const SCORE_DECIMALS = 2;

/** Lado del cheuron que indica que la fila se abre. */
const CHEVRON_SIDE = 16;

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

/**
 * Una fila: el hallazgo y su confianza, separada de la anterior por un filo.
 *
 * SE ABRE. La cifra de la derecha se lee como una probabilidad y no lo es, y si
 * la observacion paso o no el umbral del modelo no cabia en la fila sin
 * convertirla en un parrafo. Va debajo, y solo para quien lo pida: el detalle es
 * para el clinico que se detiene en una observacion, no para quien recorre diez.
 */
function ObservationRow({
  observation,
  isFirst,
}: {
  readonly observation: EcgObservation;
  readonly isFirst: boolean;
}) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={isFirst ? null : { borderTopColor: theme.edge, borderTopWidth: size.hairline }}>
      <ObservationHeader
        observation={observation}
        isOpen={isOpen}
        onToggle={() => setIsOpen((open) => !open)}
      />
      {isOpen ? <ObservationDetail observation={observation} /> : null}
    </View>
  );
}

interface ObservationHeaderProps {
  readonly observation: EcgObservation;
  readonly isOpen: boolean;
  readonly onToggle: () => void;
}

/** La parte siempre visible: el hallazgo, su confianza y el cheuron que la abre. */
function ObservationHeader({ observation, isOpen, onToggle }: ObservationHeaderProps) {
  const theme = useTheme();
  const press = usePressMotion();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      accessibilityLabel={spokenRow(observation, isOpen)}
      onPress={onToggle}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.row, press.style]}
    >
      <Text style={[type.body, styles.label, { color: theme.textHigh }]}>
        {observationLabel(observation.label)}
      </Text>
      <Text style={[type.data, { color: theme.textLow }]}>{percentOf(observation)} %</Text>
      <ObservationChevron isOpen={isOpen} />
    </AnimatedPressable>
  );
}

/** El cheuron, girado media vuelta cuando la fila esta abierta. */
function ObservationChevron({ isOpen }: { readonly isOpen: boolean }) {
  const theme = useTheme();

  return (
    <View style={isOpen ? styles.chevronOpen : null}>
      <LineIcon
        path={NAV_ICON_PATHS.chevronDown}
        color={theme.textLow}
        viewBox={NAV_ICON_VIEWBOX}
        side={CHEVRON_SIDE}
      />
    </View>
  );
}

/** La confianza en porcentaje entero. Ver la nota de PERCENT: se trunca. */
function percentOf(observation: EcgObservation): number {
  return Math.floor(observation.confidence * PERCENT);
}

/**
 * Lo que oye un lector de pantalla en la fila.
 *
 * Dice tambien si al tocar se abre o se cierra: quien no ve el cheuron no tiene
 * otra forma de saber que la fila esconde algo.
 *
 * @param observation Observacion de la fila.
 * @param isOpen Si el detalle esta desplegado.
 * @returns La frase completa.
 */
function spokenRow(observation: EcgObservation, isOpen: boolean): string {
  const action = isOpen ? STUDY_TEXT.observationClose : STUDY_TEXT.observationOpen;
  const confidence = `${percentOf(observation)}% ${STUDY_TEXT.confidenceLabel}`;

  return `${observationLabel(observation.label)}. ${confidence}. ${STUDY_TEXT.observationNeedsReview}. ${action}.`;
}

/**
 * El detalle de una observacion.
 *
 * SOLO DICE LO QUE EL ANALISIS SABE. La puntuacion exacta, si paso el umbral y
 * que hay que confirmarla. NO lleva las derivaciones: el pipeline las calcula
 * una vez para la lectura entera y se las pone iguales a todas, asi que
 * escribirlas aqui insinuaria que esta observacion se apoya en unas y otra en
 * otras. Tampoco lleva texto clinico por etiqueta: eso lo redacta un cardiologo,
 * y hasta entonces no se inventa.
 */
function ObservationDetail({ observation }: { readonly observation: EcgObservation }) {
  const theme = useTheme();
  const score = observation.confidence.toFixed(SCORE_DECIMALS).replace('.', ',');

  return (
    <View style={[styles.detail, { borderTopColor: theme.edge }]}>
      <Text style={[type.caption, { color: theme.textHigh }]}>
        {STUDY_TEXT.observationScore}: {score}
      </Text>
      <Text style={[type.caption, { color: theme.textLow }]}>
        {STUDY_TEXT.observationScoreNote}
      </Text>
      <Text style={[type.caption, { color: theme.textLow }]}>{thresholdNote(observation)}</Text>
    </View>
  );
}

/**
 * Que decir del umbral de una observacion.
 *
 * Son tres estados y no dos: sin umbral definido no es lo mismo que no llegar a
 * el, y colapsarlos haria pasar por descartado un hallazgo que nadie ha medido.
 *
 * @param observation Observacion a describir.
 * @returns La frase del umbral.
 */
function thresholdNote(observation: EcgObservation): string {
  if (observation.aboveThreshold === null) {
    return STUDY_TEXT.observationNoThreshold;
  }

  return observation.aboveThreshold
    ? STUDY_TEXT.observationAboveThreshold
    : STUDY_TEXT.observationBelowThreshold;
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
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  detail: {
    borderTopWidth: size.hairline,
    paddingHorizontal: gap.lg,
    paddingVertical: gap.md,
    gap: gap.xs,
  },
});
