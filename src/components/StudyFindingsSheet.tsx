import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { QueuedStudy } from '@/capture/study';
import {
  BottomSheet,
  SHEET_HEADER_HEIGHT,
  type SheetLabels,
  type SheetTab,
} from '@/components/BottomSheet';
import { MeasurementList } from '@/components/MeasurementList';
import { ObservationList } from '@/components/ObservationList';
import { StudyNotes } from '@/components/StudyNotes';
import { StudyReportActions } from '@/components/StudyReportActions';
import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgAnalysis } from '@/ecg/EcgAnalysisService';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';
import { SHEET_HEIGHT_RATIO, sheetClosedOffset } from '@/shell/sheetSnap';
import { useBottomSheet } from '@/shell/useBottomSheet';

type StudyTab = 'findings' | 'measurements' | 'notes';

const TABS: readonly SheetTab<StudyTab>[] = [
  { value: 'findings', label: STUDY_TEXT.tabFindings },
  { value: 'measurements', label: STUDY_TEXT.tabMeasurements },
  { value: 'notes', label: STUDY_TEXT.tabNotes },
];

const LABELS: SheetLabels = {
  open: STUDY_TEXT.sheetOpen,
  close: STUDY_TEXT.sheetClose,
  tabs: STUDY_TEXT.sheetTabsLabel,
};

interface StudyFindingsSheetProps {
  readonly study: QueuedStudy;
  readonly analysis: EcgAnalysis;
}

/**
 * La hoja del detalle de un estudio listo: hallazgos, medidas y notas.
 *
 * Solo existe cuando el analisis esta listo. En los demas estados no hay hallazgos
 * ni medidas que ensenar, y una hoja con dos pestanas vacias seria ruido: ahi las
 * notas van en la propia pantalla, como antes.
 *
 * @param study Estudio en cuestion.
 * @param analysis Analisis ya listo.
 * @returns La hoja.
 */
export function StudyFindingsSheet({ study, analysis }: StudyFindingsSheetProps) {
  const [tab, setTab] = useState<StudyTab>('findings');
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const height = windowHeight * SHEET_HEIGHT_RATIO;
  const sheet = useBottomSheet(sheetClosedOffset(height, SHEET_HEADER_HEIGHT, insets.bottom));

  return (
    <BottomSheet
      {...{ sheet, height }}
      tabs={TABS}
      activeTab={tab}
      onSelectTab={setTab}
      labels={LABELS}
    >
      <ScrollView
        contentContainerStyle={[styles.pane, { paddingBottom: insets.bottom + gap.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        <SheetPane tab={tab} study={study} analysis={analysis} />
      </ScrollView>
    </BottomSheet>
  );
}

interface SheetPaneProps extends StudyFindingsSheetProps {
  readonly tab: StudyTab;
}

/** El contenido de la pestana elegida. */
function SheetPane({ tab, study, analysis }: SheetPaneProps) {
  const theme = useTheme();

  if (tab === 'findings') {
    return <ObservationList observations={analysis.observations} />;
  }

  if (tab === 'measurements') {
    return analysis.measurements === null ? (
      <Text style={[type.body, { color: theme.textLow }]}>{STUDY_TEXT.noMeasurements}</Text>
    ) : (
      <MeasurementList measurements={analysis.measurements} />
    );
  }

  return (
    <View style={styles.notes}>
      <StudyNotes studyId={study.id} isTitled={false} />
      <StudyReportActions study={study} analysis={analysis} />
    </View>
  );
}

const styles = StyleSheet.create({
  pane: { paddingHorizontal: gap.xl, paddingTop: gap.lg },
  notes: { gap: gap.lg },
});
