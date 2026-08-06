import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { useUploadQueue } from '@/capture/uploadQueue';
import { AnalysisSection } from '@/components/AnalysisSection';
import { ScreenHeader } from '@/components/ScreenHeader';
import { StudyNotes } from '@/components/StudyNotes';
import { StudyReportActions } from '@/components/StudyReportActions';
import { MOUNT_COPY } from '@/constants/captureText';
import { STUDY_TEXT } from '@/constants/studyText';
import { useAnalysis } from '@/ecg/analyses';
import { Background } from '@/design/Background';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

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
  const theme = useTheme();
  const study = useUploadQueue((state) => state.studies.find((item) => item.id === studyId));
  const analysis = useAnalysis(studyId);

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
      <ScrollView contentContainerStyle={styles.content}>
        <StudyHeader study={study} />

        <Text style={[type.caption, styles.notice, { color: theme.textHigh }]}>
          {STUDY_TEXT.supportOnly}
        </Text>

        <AnalysisSection study={study} analysis={analysis} />

        {analysis?.status === 'ready' ? (
          <StudyReportActions study={study} analysis={analysis} />
        ) : null}

        <StudyNotes studyId={studyId} />
      </ScrollView>
    </Background>
  );
}

/**
 * Identificador, fecha, montaje y calibracion del estudio.
 *
 * EL TITULAR ES EL MONTAJE Y EL IDENTIFICADOR VA DE ETIQUETA. Al reves de como
 * estaba: un identificador anonimo en display seria una cadena tecnica gritada, y
 * lo que le dice al clinico donde esta es el tipo de registro que tiene delante.
 * El identificador y la calibracion van en monoespaciada, que es lo que §6 pide
 * para cifras e identificadores.
 */
function StudyHeader({ study }: { readonly study: QueuedStudy }) {
  const theme = useTheme();
  const { calibration, capturedAt, mount, anonymousId } = study.metadata;

  return (
    <View style={styles.header}>
      <ScreenHeader title={MOUNT_COPY[mount].label} eyebrow={anonymousId} />
      <Text style={[type.data, { color: theme.textLow }]}>
        {new Date(capturedAt).toLocaleString()} · {calibration.speedMmPerSecond} mm/s ·{' '}
        {calibration.gainMmPerMillivolt} mm/mV
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: gap.lg, gap: gap.xl },
  header: { gap: gap.xs },
  notice: { fontStyle: 'italic' },
});
