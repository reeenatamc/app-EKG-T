import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { ActionButton } from '@/components/ActionButton';
import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgAnalysis } from '@/ecg/EcgAnalysisService';
import { exportReport } from '@/ecg/exportReport';
import { useStudyNote } from '@/ecg/notes';
import { gap } from '@/design/tokens';

interface StudyReportActionsProps {
  readonly study: QueuedStudy;
  readonly analysis: EcgAnalysis;
}

/**
 * Exportar el informe del estudio.
 *
 * El boton queda ocupado mientras se genera el PDF: componer el documento y
 * pasarlo por el motor de impresion tarda lo suficiente como para que un
 * segundo toque lance dos exportaciones.
 *
 * @param study Estudio del informe.
 * @param analysis Analisis ya listo.
 * @returns Las acciones del informe.
 */
export function StudyReportActions({ study, analysis }: StudyReportActionsProps) {
  const note = useStudyNote(study.id);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    void exportReport(study, analysis, note)
      .then(() => setIsExporting(false))
      .catch((error: unknown) => {
        setIsExporting(false);
        console.error('[report] no se pudo exportar el informe', error);
      });
  };

  return (
    <View style={styles.actions}>
      <ActionButton
        label={STUDY_TEXT.exportAction}
        onPress={handleExport}
        variant="secondary"
        disabled={isExporting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row', gap: gap.md },
});
