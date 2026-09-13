import { StyleSheet, Text, View } from 'react-native';

import type { StudyCounts } from '@/capture/studyState';
import { HOME_TEXT } from '@/constants/shellText';
import { FrostCard } from '@/design/Frost';
import { useTheme } from '@/design/theme';
import { gap, size } from '@/design/tokens';
import { type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';

interface StudySummaryProps {
  readonly counts: StudyCounts;
  /** Lleva al historial, que es donde se ve cada uno. */
  readonly onPress: () => void;
}

const COLUMNS = [
  { key: 'ready', label: HOME_TEXT.summaryReady },
  { key: 'inProgress', label: HOME_TEXT.summaryInProgress },
  { key: 'failed', label: HOME_TEXT.summaryFailed },
] as const;

/**
 * Cuantos estudios hay listos, en curso y con error, en tres tarjetas escarchadas.
 *
 * Son recuentos administrativos, no cifras clinicas, asi que pueden ir sobre la
 * escarcha. Antes llevaban un fondo radial propio pintado en un segundo lienzo de
 * Skia; con la atmosfera suave detras ya no hace falta, y la pantalla vuelve a
 * tener un solo lienzo (§1).
 *
 * @param counts Recuentos por estado.
 * @param onPress Abre el historial.
 * @returns La fila de recuentos.
 */
export function StudySummary({ counts, onPress }: StudySummaryProps) {
  return (
    <View style={styles.strip}>
      {COLUMNS.map((column) => (
        <SummaryCell
          key={column.key}
          label={column.label}
          count={counts[column.key]}
          onPress={onPress}
        />
      ))}
    </View>
  );
}

interface SummaryCellProps {
  readonly label: string;
  readonly count: number;
  readonly onPress: () => void;
}

/** Cada recuento abre el historial completo; la etiqueta anuncia ese destino. */
function SummaryCell({ label, count, onPress }: SummaryCellProps) {
  const theme = useTheme();
  const press = usePressMotion();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${count} ${label}. ${HOME_TEXT.summaryOpen}`}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.tile, press.style]}
    >
      <FrostCard style={styles.cell}>
        <Text style={[type.figure, { color: theme.textHigh }]}>{count}</Text>
        <Text style={[type.caption, { color: theme.textHigh }]}>{label}</Text>
      </FrostCard>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', gap: gap.md },
  tile: { flex: 1, minWidth: 0 },
  cell: {
    flex: 1,
    minHeight: size.summaryTile,
    paddingVertical: gap.lg,
    paddingHorizontal: gap.md,
    gap: gap.sm,
  },
});
