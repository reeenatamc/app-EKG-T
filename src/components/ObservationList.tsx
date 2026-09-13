import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { LineIcon } from '@/components/icons/LineIcon';
import { NAV_ICON_PATHS, NAV_ICON_VIEWBOX } from '@/components/icons/navIcons';
import { observationLabel, type ObservationGroup } from '@/constants/labelsEs';
import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgObservation } from '@/ecg/EcgAnalysisService';
import { confidencePercent, listedGroups } from '@/ecg/findings';
import { useTheme } from '@/design/theme';
import { findingMeter, gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';

interface ObservationListProps {
  readonly observations: readonly EcgObservation[];
}

/** Decimales de la puntuacion cruda del modelo, en el detalle. */
const SCORE_DECIMALS = 2;

/** Lado del cheuron que indica que la fila se abre. */
const CHEVRON_SIDE = 16;

/** Ancho de la cifra: alinea los porcentajes en columna, de «0 %» a «99 %». */
const PERCENT_WIDTH = 44;

/**
 * Lo que el modelo observo en el trazado.
 *
 * NO SON DIAGNOSTICOS y la pantalla no deja lugar a dudas: el aviso de que esto
 * es una lectura automatica va arriba, la lista dice que todas requieren
 * confirmacion, y ninguna se pinta con color de estado. Un rojo o un verde aqui
 * convertirian una sugerencia en un veredicto, ademas de invadir la paleta de
 * alarma de §12.
 *
 * UNA TABLA, NO UNA TARJETA POR OBSERVACION. Una fila por observacion --el
 * hallazgo, una barra fina para comparar de un vistazo y la confianza-- y la
 * advertencia una vez, encima. Cada fila la sigue diciendo a quien la recorre con
 * lector de pantalla, que no ve la cabecera.
 *
 * SIN CAJA. Vive dentro de la hoja del detalle, que ya es superficie opaca; una
 * tabla con filo dentro de otra superficie era un marco dentro de un marco (D-30).
 *
 * LAS DERIVACIONES NO SE PINTAN POR FILA. El pipeline las calcula una vez para la
 * lectura entera; se dicen una vez, junto al trazado.
 *
 * AGRUPADA POR CATEGORIA CLINICA con `listedGroups`, la misma agrupacion de la que
 * sale la tarjeta del hallazgo principal, para que las dos cuenten lo mismo.
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
    <View style={styles.block}>
      <Text style={[type.caption, { color: theme.textHigh }]}>
        {STUDY_TEXT.observationsReviewAll}
      </Text>
      {listedGroups(observations).map((group) => (
        <ObservationGroupTable key={group.category} group={group} />
      ))}
    </View>
  );
}

/** Rotulo de la categoria y sus filas. */
function ObservationGroupTable({ group }: { readonly group: ObservationGroup }) {
  const theme = useTheme();

  return (
    <View style={styles.group}>
      <Text style={[type.eyebrow, { color: theme.textLow }]}>{group.title}</Text>
      {group.observations.map((observation) => (
        <ObservationRow key={observation.id} observation={observation} />
      ))}
    </View>
  );
}

/**
 * Una fila: el hallazgo y su confianza, con un filo debajo.
 *
 * SE ABRE. La cifra de la derecha se lee como una probabilidad y no lo es, y si
 * la observacion paso o no el umbral del modelo no cabia en la fila sin
 * convertirla en un parrafo. Va debajo, y solo para quien lo pida.
 */
function ObservationRow({ observation }: { readonly observation: EcgObservation }) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={{ borderBottomColor: theme.edge, borderBottomWidth: size.hairline }}>
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

/** La parte siempre visible: el hallazgo, su barra, su confianza y el cheuron. */
function ObservationHeader({ observation, isOpen, onToggle }: ObservationHeaderProps) {
  const theme = useTheme();
  const press = usePressMotion();
  const percent = confidencePercent(observation.confidence);

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
      <ConfidenceMeter percent={percent} />
      <Text style={[type.data, styles.percent, { color: theme.textLow }]}>{percent} %</Text>
      <ObservationChevron isOpen={isOpen} />
    </AnimatedPressable>
  );
}

/**
 * Barra fina de confianza, en gris ciruela y no en tinta ni en color de estado.
 *
 * Todas las barras miden lo mismo de ancho, asi que se comparan de un vistazo. La
 * cifra de al lado es la que se lee.
 */
function ConfidenceMeter({ percent }: { readonly percent: number }) {
  const theme = useTheme();
  const fill = findingMeter[theme.mode === 'dark' ? 'dark' : 'light'];

  return (
    <View style={[styles.meter, { backgroundColor: theme.canvas }]}>
      <View style={[styles.meterFill, { width: `${percent}%`, backgroundColor: fill }]} />
    </View>
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
  const confidence = `${confidencePercent(observation.confidence)}% ${STUDY_TEXT.confidenceLabel}`;

  return `${observationLabel(observation.label)}. ${confidence}. ${STUDY_TEXT.observationNeedsReview}. ${action}.`;
}

/**
 * El detalle de una observacion.
 *
 * SOLO DICE LO QUE EL ANALISIS SABE. La puntuacion exacta, si paso el umbral y
 * que hay que confirmarla. NO lleva las derivaciones: el pipeline las calcula
 * una vez para la lectura entera. Tampoco lleva texto clinico por etiqueta: eso
 * lo redacta un cardiologo, y hasta entonces no se inventa.
 */
function ObservationDetail({ observation }: { readonly observation: EcgObservation }) {
  const theme = useTheme();
  const score = observation.confidence.toFixed(SCORE_DECIMALS).replace('.', ',');

  return (
    <View style={styles.detail}>
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
  group: { gap: gap.xs },
  row: {
    minHeight: size.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.md,
    paddingVertical: gap.md,
  },
  label: { flex: 1 },
  meter: {
    width: size.findingMeterWidth,
    height: size.findingMeter,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  meterFill: { height: '100%', borderRadius: radius.pill },
  percent: { width: PERCENT_WIDTH, textAlign: 'right' },
  chevronOpen: { transform: [{ rotate: '180deg' }] },
  detail: { paddingBottom: gap.md, gap: gap.xs },
});
