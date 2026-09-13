import { ScrollView, StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { useUploadQueue } from '@/capture/uploadQueue';
import { AnalysisSection } from '@/components/AnalysisSection';
import { SHEET_HEADER_HEIGHT } from '@/components/BottomSheet';
import { KeyboardLift } from '@/components/KeyboardLift';
import { ReadyTrace } from '@/components/ReadyTrace';
import { ResultCard } from '@/components/ResultCard';
import { StudyDetailHeader } from '@/components/StudyDetailHeader';
import { StudyFindingsSheet } from '@/components/StudyFindingsSheet';
import { StudyNotes } from '@/components/StudyNotes';
import { CLINICAL_NOTICE } from '@/constants/studyText';
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
 * Detalle de un estudio: cabecera, resultado, aviso, trazado y hoja inferior (D-30).
 *
 * El aviso de que esto es una lectura automatica va arriba y no al pie, pegado al
 * resultado. Es la pantalla donde alguien podria tomar una decision, y un aviso al
 * final se lee despues de haber decidido.
 *
 * LA HOJA VA FUERA DEL DESPLAZAMIENTO, como hermana del `ScrollView`, y el contenido
 * reserva abajo lo que asoma de ella para que el trazado no quede debajo.
 *
 * @param studyId Identificador del estudio.
 * @returns La pantalla de detalle.
 */
export function StudyDetailScreen({ studyId }: StudyDetailScreenProps) {
  const goBack = useGoBack('/history');
  const study = useUploadQueue((state) => state.studies.find((item) => item.id === studyId));
  const analysis = useAnalysis(study?.remoteId ?? null);
  const safe = useSafePadding(gap.lg, gap.xl);

  // Puede pasar de verdad: si el estudio se descarta desde el historial mientras
  // su detalle esta abierto, esta pantalla sobrevive un fotograma sin dato.
  if (study === undefined) {
    return <Background atmosphere={false}>{null}</Background>;
  }

  const ready = analysis?.status === 'ready' ? analysis : null;
  const padding = {
    ...safe,
    paddingBottom: safe.paddingBottom + (ready ? SHEET_HEADER_HEIGHT : 0),
  };

  return (
    <Background atmosphere={false}>
      <KeyboardLift>
        <ScrollView
          contentContainerStyle={[styles.content, padding]}
          keyboardShouldPersistTaps="handled"
        >
          <StudyDetailHeader study={study} onBack={goBack} />
          <DetailBody study={study} analysis={analysis} />
        </ScrollView>
        {ready === null ? null : <StudyFindingsSheet study={study} analysis={ready} />}
      </KeyboardLift>
    </Background>
  );
}

/** Lo que va bajo la cabecera, segun el analisis este listo o no. */
function DetailBody({ study, analysis }: { study: QueuedStudy; analysis?: EcgAnalysis }) {
  return analysis?.status === 'ready' ? (
    <ReadyBody study={study} analysis={analysis} />
  ) : (
    <PendingBody study={study} analysis={analysis} />
  );
}

/**
 * Un estudio listo: la tarjeta ciruela, el aviso debajo y el trazado.
 *
 * Hallazgos, medidas y notas van en la hoja inferior.
 */
function ReadyBody({ study, analysis }: { study: QueuedStudy; analysis: EcgAnalysis }) {
  return (
    <>
      <View style={styles.result}>
        <ResultCard observations={analysis.observations} />
        <ScopeNote />
      </View>
      <ReadyTrace study={study} analysis={analysis} />
    </>
  );
}

/**
 * En cola, procesando o fallido: el aviso, el contenido del estado y las notas.
 *
 * Sin tarjeta de resultado, porque todavia no hay resultado que resumir, y sin hoja,
 * porque no hay hallazgos ni medidas que poner en ella.
 */
function PendingBody({ study, analysis }: { study: QueuedStudy; analysis?: EcgAnalysis }) {
  return (
    <>
      <ScopeNote />
      <AnalysisSection study={study} analysis={analysis} />
      <StudyNotes studyId={study.id} />
    </>
  );
}

/**
 * La linea de alcance. Una frase y no una tarjeta: pegada a lo que matiza se lee con
 * ello, y como tarjeta competia con el resultado por la primera mirada.
 */
function ScopeNote() {
  const theme = useTheme();

  return (
    <Text style={[type.caption, styles.scope, { color: theme.textLow }]}>
      {CLINICAL_NOTICE.detail}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gap.xl, gap: gap.xl },
  result: { gap: gap.sm },
  scope: { paddingHorizontal: gap.xs },
});
