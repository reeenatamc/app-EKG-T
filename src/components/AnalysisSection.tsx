import { StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { ActionButton } from '@/components/ActionButton';
import { ProcessingIndicator } from '@/components/ProcessingIndicator';
import { StudyTrace } from '@/components/StudyTrace';
import {
  ANALYSIS_FAILURE_COPY,
  STATUS_DETAIL,
  STATUS_TEXT,
  STUDY_TEXT,
} from '@/constants/studyText';
import { useAnalyses } from '@/ecg/analyses';
import { isWorthRetrying } from '@/ecg/retryable';
import type { EcgAnalysis } from '@/ecg/EcgAnalysisService';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface AnalysisSectionProps {
  readonly study: QueuedStudy;
  readonly analysis: EcgAnalysis | undefined;
}

/**
 * Lo que se muestra mientras el analisis no esta listo.
 *
 * Los estados tienen contenido propio, ninguno es una pantalla vacia con un texto.
 * Mientras se procesa hay algo que mirar y algo que entender; cuando falla se dice
 * por que y que se puede hacer.
 *
 * LISTO NO SE DIBUJA AQUI. Desde D-30 un estudio listo lleva tarjeta de resultado,
 * trazado y hoja inferior, y la hoja tiene que vivir fuera del desplazamiento de la
 * pantalla: lo compone `StudyDetailScreen`.
 *
 * @param study Estudio en cuestion.
 * @param analysis Analisis, o undefined mientras no llega el primero.
 * @returns El contenido del estado actual, o nada si ya esta listo.
 */
export function AnalysisSection({ study, analysis }: AnalysisSectionProps) {
  if (analysis === undefined || analysis.status === 'queued') {
    return <ProcessingIndicator isQueued />;
  }

  if (analysis.status === 'processing') {
    return <ProcessingSignal study={study} analysis={analysis} />;
  }

  if (analysis.status === 'failed') {
    // El identificador del servidor, no el del dispositivo: es el unico por el que
    // se le puede pedir nada. Pedir con el local devuelve 404, y desde fuera eso se
    // ve como un boton que no hace nada.
    return <AnalysisFailure study={study} studyId={study.remoteId} analysis={analysis} />;
  }

  return null;
}

/**
 * Mientras se procesa, con el trazado ya leido si lo hay.
 *
 * LA DIGITALIZACION ES LA MITAD RAPIDA, unos quince segundos, y la
 * interpretacion la lenta, de treinta a cincuenta y cinco. El servidor guarda
 * el trazado en cuanto lo digitaliza, asi que aqui se ensena en cuanto llega en
 * vez de esperar al final.
 *
 * EL INDICADOR SE QUEDA, con o sin trazado. El trazado es un adelanto de lo
 * que se leyo, no el resultado: la interpretacion sigue en curso y todavia
 * puede fallar.
 */
function ProcessingSignal({ study, analysis }: { study: QueuedStudy; analysis: EcgAnalysis }) {
  return (
    <View style={styles.stack}>
      {analysis.signal === null ? null : (
        <StudyTrace study={study} signal={analysis.signal} caption={STUDY_TEXT.signalReadCaption} />
      )}
      <ProcessingIndicator isQueued={false} />
    </View>
  );
}

interface AnalysisFailureProps {
  readonly study: QueuedStudy;
  /** Identificador remoto. Nulo si el estudio nunca llego al servidor. */
  readonly studyId: string | null;
  readonly analysis: EcgAnalysis;
}

/**
 * Un analisis que no salio.
 *
 * Se dice la causa y, sobre todo, que el estudio no se ha perdido. Quien acaba
 * de fotografiar un registro necesita saber eso antes que el motivo tecnico.
 *
 * SALIDA SOLO CUANDO LA HAY. El boton de reintentar no aparece en las causas que
 * no pueden terminar de otra manera -- ver isWorthRetrying. En esas, lo que hay
 * que hacer lo dice el texto de la causa.
 *
 * Y CON EL TRAZADO SI LLEGO A DIGITALIZARSE. Un fallo tras la digitalizacion no
 * borra lo que ya se leyo del papel.
 */
function AnalysisFailure({ study, studyId, analysis }: AnalysisFailureProps) {
  return (
    <View style={styles.stack}>
      {analysis.signal === null ? null : (
        <StudyTrace
          study={study}
          signal={analysis.signal}
          caption={STUDY_TEXT.signalReadFailureCaption}
        />
      )}
      <FailureCard studyId={studyId} analysis={analysis} />
    </View>
  );
}

/** El aviso de fallo en si: la causa, y la salida cuando la hay. */
function FailureCard({ studyId, analysis }: { studyId: string | null; analysis: EcgAnalysis }) {
  const theme = useTheme();
  const retry = useAnalyses((state) => state.retry);

  return (
    <View style={[styles.failure, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
      <Text style={[type.body, { color: theme.textHigh }]}>{STATUS_TEXT.failed}</Text>
      <Text style={[type.caption, { color: theme.textLow }]}>
        {analysis.failure === null ? STATUS_DETAIL.failed : ANALYSIS_FAILURE_COPY[analysis.failure]}
      </Text>

      {studyId === null || !isWorthRetrying(analysis.failure) ? null : (
        <View style={styles.failureAction}>
          <ActionButton
            label={STUDY_TEXT.retryAnalysis}
            onPress={() => retry(studyId)}
            variant="primary"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { gap: gap.xl },
  failure: {
    padding: gap.lg,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    borderWidth: size.hairline,
    gap: gap.xs,
  },
  // En fila para que el boton no se estire al ancho de la tarjeta: dentro de un
  // aviso, un boton a sangre pesa mas que el propio aviso.
  failureAction: { flexDirection: 'row', marginTop: gap.sm },
});
