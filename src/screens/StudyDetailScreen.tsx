import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { formatStudyDate } from '@/capture/studyDate';
import { useUploadQueue } from '@/capture/uploadQueue';
import { AnalysisSection } from '@/components/AnalysisSection';
import { ClinicalDisclaimer } from '@/components/ClinicalDisclaimer';
import { KeyboardLift } from '@/components/KeyboardLift';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StudyNotes } from '@/components/StudyNotes';
import { StudyReportActions } from '@/components/StudyReportActions';
import { MOUNT_COPY } from '@/constants/captureText';
import { useAnalysis } from '@/ecg/analyses';
import type { EcgAnalysis } from '@/ecg/EcgAnalysisService';
import { Background } from '@/design/Background';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';
import { useSafePadding } from '@/shell/safePadding';
import { useGoBack } from '@/shell/useGoBack';

interface StudyDetailScreenProps {
  readonly studyId: string;
}

/**
 * Detalle de un estudio: estado, trazado, medidas y observaciones.
 *
 * El aviso de que esto es una lectura automatica va arriba del todo y no al pie.
 * Es la pantalla donde alguien podria tomar una decision, y un aviso al final se
 * lee despues de haber decidido.
 *
 * @param studyId Identificador del estudio.
 * @returns La pantalla de detalle.
 */
export function StudyDetailScreen({ studyId }: StudyDetailScreenProps) {
  const goBack = useGoBack('/history');
  const study = useUploadQueue((state) => state.studies.find((item) => item.id === studyId));
  const analysis = useAnalysis(study?.remoteId ?? null);
  const safe = useSafePadding(gap.lg, gap.xl);

  // Puede pasar de verdad: si el estudio se descarta desde el historial
  // mientras su detalle esta abierto, esta pantalla sobrevive un fotograma sin
  // dato. Se sale en blanco en lugar de reventar.
  if (study === undefined) {
    return (
      <Background atmosphere={false}>
        <View />
      </Background>
    );
  }

  return (
    <Background atmosphere={false}>
      <KeyboardLift>
        <ScrollView
          contentContainerStyle={[styles.content, safe]}
          keyboardShouldPersistTaps="handled"
        >
          <StudyHeader study={study} onBack={goBack} />
          <StudyBody study={study} analysis={analysis} />
        </ScrollView>
      </KeyboardLift>
    </Background>
  );
}

interface StudyBodyProps {
  readonly study: QueuedStudy;
  readonly analysis: EcgAnalysis | undefined;
}

/**
 * Aviso, analisis, acciones del informe y notas.
 *
 * El aviso de que es una lectura automatica va delante del analisis y no al pie:
 * un aviso al final se lee despues de haber decidido.
 */
function StudyBody({ study, analysis }: StudyBodyProps) {
  return (
    <>
      <ClinicalDisclaimer />
      <AnalysisSection study={study} analysis={analysis} />
      {analysis?.status === 'ready' ? (
        <StudyReportActions study={study} analysis={analysis} />
      ) : null}
      <StudyNotes studyId={study.id} />
    </>
  );
}

/**
 * Identificador, fecha, montaje y calibracion del estudio.
 *
 * EL TITULAR ES EL MONTAJE Y EL IDENTIFICADOR VA DE ETIQUETA. Al reves de como
 * estaba: un identificador anonimo en display seria una cadena tecnica gritada, y
 * lo que le dice al clinico donde esta es el tipo de registro que tiene delante.
 * La calibración permanece junto al registro y usa la tipografía compartida.
 */
function StudyHeader({
  study,
  onBack,
}: {
  readonly study: QueuedStudy;
  readonly onBack: () => void;
}) {
  const theme = useTheme();
  const { calibration, capturedAt, mount, anonymousId } = study.metadata;

  return (
    <View style={styles.header}>
      <ScreenHeader
        title={MOUNT_COPY[mount].label}
        eyebrow={anonymousId}
        onBack={onBack}
        size="headline"
      />
      <Text style={[type.data, { color: theme.textLow }]}>
        {formatStudyDate(capturedAt, true)} · {calibration.speedMmPerSecond} mm/s ·{' '}
        {calibration.gainMmPerMillivolt} mm/mV
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gap.xl, gap: gap.xl },
  header: { gap: gap.xs },
});
