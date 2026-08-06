import { StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { MeasurementList } from '@/components/MeasurementList';
import { ObservationList } from '@/components/ObservationList';
import { ProcessingIndicator } from '@/components/ProcessingIndicator';
import { SettingsSection } from '@/components/SettingsSection';
import { TwelveLeadViewer } from '@/components/TwelveLeadViewer';
import {
  ANALYSIS_FAILURE_COPY,
  STATUS_DETAIL,
  STATUS_TEXT,
  STUDY_TEXT,
} from '@/constants/studyText';
import type { EcgAnalysis } from '@/ecg/EcgAnalysisService';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { type } from '@/design/type';

interface AnalysisSectionProps {
  readonly study: QueuedStudy;
  readonly analysis: EcgAnalysis | undefined;
}

/**
 * Lo que se muestra segun el estado del analisis.
 *
 * Los cuatro estados tienen contenido propio, ninguno es una pantalla vacia con
 * un texto. Mientras se procesa hay algo que mirar y algo que entender; cuando
 * falla se dice por que y que se puede hacer.
 *
 * @param study Estudio en cuestion.
 * @param analysis Analisis, o undefined mientras no llega el primero.
 * @returns El contenido del estado actual.
 */
export function AnalysisSection({ study, analysis }: AnalysisSectionProps) {
  if (analysis === undefined || analysis.status === 'queued') {
    return <ProcessingIndicator isQueued />;
  }

  if (analysis.status === 'processing') {
    return <ProcessingIndicator isQueued={false} />;
  }

  if (analysis.status === 'failed') {
    return <AnalysisFailure analysis={analysis} />;
  }

  return <ReadyAnalysis study={study} analysis={analysis} />;
}

/** Trazado, medidas y observaciones de un estudio ya procesado. */
function ReadyAnalysis({ study, analysis }: { study: QueuedStudy; analysis: EcgAnalysis }) {
  return (
    <View style={styles.ready}>
      <SettingsSection title={STUDY_TEXT.signalSection}>
        {analysis.signal === null ? null : (
          <TwelveLeadViewer
            signal={analysis.signal}
            mount={study.metadata.mount}
            calibration={study.metadata.calibration}
          />
        )}
      </SettingsSection>

      {analysis.measurements === null ? null : (
        <SettingsSection title={STUDY_TEXT.measurementsSection}>
          <MeasurementList measurements={analysis.measurements} />
        </SettingsSection>
      )}

      <SettingsSection title={STUDY_TEXT.observationsSection}>
        <ObservationList observations={analysis.observations} />
      </SettingsSection>
    </View>
  );
}

/**
 * Un analisis que no salio.
 *
 * Se dice la causa y, sobre todo, que el estudio no se ha perdido. Quien acaba
 * de fotografiar un registro necesita saber eso antes que el motivo tecnico.
 */
function AnalysisFailure({ analysis }: { readonly analysis: EcgAnalysis }) {
  const theme = useTheme();

  return (
    <View style={[styles.failure, { backgroundColor: theme.surface }]}>
      <Text style={[type.body, { color: theme.textHigh }]}>{STATUS_TEXT.failed}</Text>
      <Text style={[type.caption, { color: theme.textLow }]}>
        {analysis.failure === null ? STATUS_DETAIL.failed : ANALYSIS_FAILURE_COPY[analysis.failure]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  ready: { gap: gap.xl },
  failure: { padding: gap.lg, borderRadius: radius.tile, gap: gap.xs },
});
