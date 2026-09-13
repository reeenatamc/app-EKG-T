import { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { observationLabel } from '@/constants/labelsEs';
import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgObservation } from '@/ecg/EcgAnalysisService';
import {
  confidencePercent,
  summarizeFindings,
  type CategoryCount,
  type PrincipalFinding as Principal,
} from '@/ecg/findings';
import { cardShadow } from '@/design/elevation';
import { useTheme, type Theme } from '@/design/theme';
import { gap, radius, resultCard, size } from '@/design/tokens';
import { font, type } from '@/design/type';

interface ResultCardProps {
  readonly observations: readonly EcgObservation[];
}

/**
 * Tarjeta del hallazgo principal: el de mas puntuacion y cuantos hay por categoria.
 *
 * CIRUELA, NUNCA CARMIN. En salud el rojo se lee como alarma, y la lectura de un
 * modelo no es una alarma. Destaca por densidad, en la tinta oscura de la marca, y
 * el carmin se queda para las acciones (D-30).
 *
 * SUPERFICIE OPACA: lleva cifras de la lectura y §12.1 no admite vidrio debajo.
 *
 * Sin observaciones que mostrar no se inventa un principal: se dice, con el mismo
 * texto que la lista, y no se pinta ni barra ni recuento.
 *
 * @param observations Observaciones del analisis, sin filtrar.
 * @returns La tarjeta.
 */
export function ResultCard({ observations }: ResultCardProps) {
  const theme = useTheme();
  const { principal, counts } = useMemo(() => summarizeFindings(observations), [observations]);

  return (
    <View style={[styles.card, cardSurface(theme), cardShadow]}>
      <Text style={[type.caption, { color: resultCard.inkLow }]}>
        {STUDY_TEXT.principalFinding}
      </Text>
      {principal === null ? (
        <Text style={[type.body, { color: resultCard.ink }]}>{STUDY_TEXT.noObservations}</Text>
      ) : (
        <PrincipalFinding principal={principal} />
      )}
      {counts.length === 0 ? null : <CategoryCounts counts={counts} />}
    </View>
  );
}

/**
 * Relleno y bisel de la tarjeta segun el tema.
 *
 * @param theme Tema activo.
 * @returns El estilo de superficie.
 */
function cardSurface(theme: Theme): ViewStyle {
  const palette = resultCard[theme.mode === 'dark' ? 'dark' : 'light'];

  return {
    backgroundColor: palette.surface,
    borderTopColor: palette.rim,
    borderLeftColor: palette.rim,
    borderBottomColor: palette.shade,
    borderRightColor: palette.shade,
  };
}

/**
 * El hallazgo, su porcentaje, su categoria y la barra de confianza.
 *
 * Un solo elemento para el lector de pantalla, que oye la frase entera y el
 * recordatorio de que hay que confirmarlo: no ve la linea de aviso de debajo.
 */
function PrincipalFinding({ principal }: { readonly principal: Principal }) {
  const { observation, categoryTitle } = principal;
  const percent = confidencePercent(observation.confidence);
  const label = observationLabel(observation.label);
  const spoken = `${label}. ${percent}% ${STUDY_TEXT.confidenceLabel}. ${STUDY_TEXT.categoryLabel}: ${categoryTitle}. ${STUDY_TEXT.observationNeedsReview}.`;

  return (
    <View accessible accessibilityLabel={spoken} style={styles.finding}>
      <View style={styles.headline}>
        <Text style={[styles.findingLabel, { color: resultCard.ink }]}>{label}</Text>
        <Text style={[type.section, { color: resultCard.ink }]}>{percent} %</Text>
      </View>
      <View style={styles.meta}>
        <View style={[styles.tag, { backgroundColor: resultCard.tag }]}>
          <Text style={[type.caption, { color: resultCard.ink }]}>{categoryTitle}</Text>
        </View>
        <View style={[styles.bar, { backgroundColor: resultCard.track }]}>
          <View
            style={[styles.barFill, { width: `${percent}%`, backgroundColor: resultCard.ink }]}
          />
        </View>
      </View>
    </View>
  );
}

/** Pie de la tarjeta: cuantos hallazgos hay en cada categoria. */
function CategoryCounts({ counts }: { readonly counts: readonly CategoryCount[] }) {
  const spoken = counts.map((entry) => `${entry.count} ${entry.title}`).join(', ');

  return (
    <View
      accessible
      accessibilityLabel={`${STUDY_TEXT.categoryCountsLabel}: ${spoken}`}
      style={[styles.counts, { borderTopColor: resultCard.track }]}
    >
      {counts.map((entry) => (
        <View key={entry.category} style={styles.count}>
          <Text style={[type.section, { color: resultCard.ink }]}>{entry.count}</Text>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            style={[type.caption, { color: resultCard.inkLow }]}
          >
            {entry.shortTitle}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    borderWidth: size.hairline,
    paddingHorizontal: gap.lg,
    paddingTop: gap.lg,
    paddingBottom: gap.md,
  },
  finding: { gap: gap.sm, marginTop: gap.xs },
  headline: { flexDirection: 'row', alignItems: 'baseline', gap: gap.md },
  findingLabel: { ...type.h1, fontFamily: font.semibold, flex: 1 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: gap.md },
  tag: { borderRadius: radius.pill, paddingHorizontal: gap.md, paddingVertical: gap.xs },
  bar: { flex: 1, height: size.confidenceBar, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: radius.pill },
  // Una sola fila: con cinco categorias el ajuste de linea dejaba una sola abajo.
  counts: {
    flexDirection: 'row',
    gap: gap.xs,
    marginTop: gap.md,
    paddingTop: gap.md,
    borderTopWidth: size.hairline,
  },
  count: { flex: 1, minWidth: 0, alignItems: 'center' },
});
