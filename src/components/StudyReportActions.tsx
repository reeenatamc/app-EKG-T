import { StyleSheet, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { ActionButton } from '@/components/ActionButton';
import { Notice } from '@/components/Notice';
import { STUDY_TEXT } from '@/constants/studyText';
import type { EcgAnalysis } from '@/ecg/EcgAnalysisService';
import { exportReport } from '@/ecg/exportReport';
import { useStudyNote } from '@/ecg/notes';
import { gap } from '@/design/tokens';
import { useTask } from '@/shell/useTask';

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
 * Y SI NO SALE, SE DICE. Antes el fallo solo se registraba en consola: el boton
 * se volvia a habilitar sin mas, que desde fuera es indistinguible de una
 * exportacion que si funciono y no abrio nada.
 *
 * @param study Estudio del informe.
 * @param analysis Analisis ya listo.
 * @returns Las acciones del informe.
 */
export function StudyReportActions({ study, analysis }: StudyReportActionsProps) {
  const note = useStudyNote(study.id);
  const task = useTask('[report] no se pudo exportar el informe');

  return (
    <View style={styles.block}>
      {task.hasFailed ? (
        <Notice title={STUDY_TEXT.exportFailure.title} action={STUDY_TEXT.exportFailure.action} />
      ) : null}

      <View style={styles.actions}>
        <ActionButton
          label={STUDY_TEXT.exportAction}
          onPress={() => task.run(() => exportReport(study, analysis, note))}
          variant="secondary"
          disabled={task.isBusy}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // El aviso va encima de los botones y no al lado: es una linea de texto, y en
  // fila con un boton se leeria como su etiqueta.
  block: { gap: gap.md },
  actions: { flexDirection: 'row', gap: gap.md },
});
