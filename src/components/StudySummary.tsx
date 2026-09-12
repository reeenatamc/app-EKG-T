import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { StudyCounts } from '@/capture/studyState';
import { HOME_TEXT } from '@/constants/shellText';
import { SummaryBackdrop } from '@/design/SummaryBackdrop';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';

interface StudySummaryProps {
  readonly counts: StudyCounts;
  readonly onPress: () => void;
}

const COLUMNS = [
  { key: 'ready', label: HOME_TEXT.summaryReady },
  { key: 'inProgress', label: HOME_TEXT.summaryInProgress },
  { key: 'failed', label: HOME_TEXT.summaryFailed },
] as const;

/** Tres tarjetas independientes con manchas radiales suaves en un solo lienzo. */
export function StudySummary({ counts, onPress }: StudySummaryProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  return (
    <View style={styles.strip} onLayout={({ nativeEvent }) => setLayout(nativeEvent.layout)}>
      <SummaryBackdrop width={layout.width} height={layout.height} count={COLUMNS.length} />
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

/** Cada recuento abre el historial completo; la etiqueta anuncia ese destino. */
function SummaryCell({
  label,
  count,
  onPress,
}: {
  readonly label: string;
  readonly count: number;
  readonly onPress: () => void;
}) {
  const theme = useTheme();
  const press = usePressMotion();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={`${count} ${label}. ${HOME_TEXT.summaryOpen}`}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.cell, press.style]}
    >
      <Text style={[type.figure, { color: theme.textHigh }]}>{count}</Text>
      <Text style={[type.caption, { color: theme.textHigh }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  strip: { flexDirection: 'row', gap: gap.md },
  cell: {
    flex: 1,
    minHeight: size.summaryTile,
    minWidth: 0,
    paddingVertical: gap.lg,
    paddingHorizontal: gap.md,
    gap: gap.sm,
    borderRadius: radius.tile,
  },
});
