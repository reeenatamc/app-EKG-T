import { StyleSheet, Text, View } from 'react-native';

import type { StudyCounts, StudyState } from '@/capture/studyState';
import { HOME_TEXT } from '@/constants/shellText';
import { useTheme } from '@/design/theme';
import { gap, radius, size, studyTone } from '@/design/tokens';
import { type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';

interface StudySummaryProps {
  readonly counts: StudyCounts;
  /** Lleva al historial, que es donde se ve cada uno. */
  readonly onPress: () => void;
}

interface SummaryColumn {
  readonly key: keyof StudyCounts;
  /** De que estado toma el tono el punto: el mismo que en la fila del historial. */
  readonly tone: StudyState;
  readonly label: string;
}

const COLUMNS: readonly SummaryColumn[] = [
  { key: 'ready', tone: 'ready', label: HOME_TEXT.summaryReady },
  { key: 'inProgress', tone: 'analyzing', label: HOME_TEXT.summaryInProgress },
  { key: 'failed', tone: 'failed', label: HOME_TEXT.summaryFailed },
];

/**
 * Cuantos estudios hay listos, en curso y con error, en una fila.
 *
 * NO ES UNA TARJETA. Las tarjetas del inicio eran iguales para lo que cambia —lo
 * que esta en proceso, los ultimos estudios— y para lo que no —el aviso clinico—,
 * y asi nada decia que era cada cosa. Esto es una lectura, como la de un
 * instrumento: tres cifras sobre el lienzo, entre dos filos. Las tarjetas se
 * quedan para los estudios, que son lo que se abre.
 *
 * LOS PUNTOS SON LOS DEL HISTORIAL, con el mismo tono por estado, para que el
 * rojo de "con error" aqui sea el mismo que se busca luego en la lista. Una cifra
 * a cero va atenuada: lo que tiene que saltar a la vista es lo que no es cero.
 *
 * @param counts Recuentos por estado.
 * @param onPress Abre el historial.
 * @returns La fila de recuentos.
 */
export function StudySummary({ counts, onPress }: StudySummaryProps) {
  const press = usePressMotion();
  const spoken = COLUMNS.map((column) => `${counts[column.key]} ${column.label}`).join(', ');

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${HOME_TEXT.summaryOpen}. ${spoken}`}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.strip, press.style]}
    >
      {COLUMNS.map((column, index) => (
        <SummaryCell
          key={column.key}
          column={column}
          count={counts[column.key]}
          isFirst={index === 0}
        />
      ))}
    </AnimatedPressable>
  );
}

/** Una columna: la cifra y, debajo, el punto con el nombre del estado. */
function SummaryCell({
  column,
  count,
  isFirst,
}: {
  readonly column: SummaryColumn;
  readonly count: number;
  readonly isFirst: boolean;
}) {
  const theme = useTheme();
  const tone = studyTone[theme.mode === 'dark' ? 'dark' : 'light'][column.tone];
  const divider = isFirst ? null : { borderLeftColor: theme.edge, borderLeftWidth: size.hairline };

  return (
    <View style={[styles.cell, divider]}>
      <Text style={[type.figure, { color: count === 0 ? theme.textLow : theme.textHigh }]}>
        {count}
      </Text>
      <View style={styles.label}>
        <View style={[styles.dot, { backgroundColor: tone }]} />
        <Text style={[type.caption, { color: theme.textLow }]} numberOfLines={1}>
          {column.label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Va dentro de la tarjeta de resumen del inicio, que ya le da el contorno.
  strip: { flexDirection: 'row', paddingVertical: gap.sm },
  cell: { flex: 1, gap: gap.xs, paddingHorizontal: gap.md },
  label: { flexDirection: 'row', alignItems: 'center', gap: gap.xs },
  dot: { width: gap.sm, height: gap.sm, borderRadius: radius.pill },
});
