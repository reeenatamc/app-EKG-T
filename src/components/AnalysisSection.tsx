import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { ActionButton } from '@/components/ActionButton';
import { MeasurementList } from '@/components/MeasurementList';
import { ObservationList } from '@/components/ObservationList';
import { presentLeads } from '@/ecg/leads';
import type { EcgSignal, LeadName } from '@/ecg/signal';
import { ProcessingIndicator } from '@/components/ProcessingIndicator';
import { SettingsSection } from '@/components/SettingsSection';
import { TwelveLeadViewer } from '@/components/TwelveLeadViewer';
import {
  ANALYSIS_FAILURE_COPY,
  STATUS_DETAIL,
  STATUS_TEXT,
  STUDY_TEXT,
} from '@/constants/studyText';
import { useAnalyses } from '@/ecg/analyses';
import { isWorthRetrying } from '@/ecg/retryable';
import type { EcgAnalysis, EcgObservation } from '@/ecg/EcgAnalysisService';
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
    // El identificador del servidor, no el del dispositivo: es el unico por el que
    // se le puede pedir nada. Pedir con el local devuelve 404, y desde fuera eso se
    // ve como un boton que no hace nada.
    return <AnalysisFailure studyId={study.remoteId} analysis={analysis} />;
  }

  return <ReadyAnalysis study={study} analysis={analysis} />;
}

/**
 * Las derivaciones de las que sale la lectura.
 *
 * Se unen las de todas las observaciones porque el pipeline se las pone iguales
 * a todas: las calcula una vez para la lectura entera. El modelo no localiza
 * hallazgos -- recibe una senal y devuelve puntuaciones-- asi que no hay forma de
 * saber en cual se ve cada cosa. La union deja esto correcto si algun dia las
 * distingue, sin prometerlo hoy.
 *
 * @param signal Senal digitalizada, o null si no la hay.
 * @param observations Observaciones de la lectura.
 * @returns Las derivaciones presentes, o null si no se puede decir.
 */
function readingBasis(
  signal: EcgSignal | null,
  observations: readonly EcgObservation[],
): readonly LeadName[] | null {
  if (signal === null) {
    return null;
  }

  const named = [...new Set(observations.flatMap((observation) => observation.leads))];

  return presentLeads(signal, named);
}

interface ReadingBasisProps {
  readonly basis: readonly LeadName[] | null;
  readonly isShown: boolean;
  readonly onToggle: () => void;
}

/**
 * De donde sale la lectura, y el interruptor para verlo en el trazado.
 *
 * UN SOLO INTERRUPTOR, y no una seleccion por observacion. Tocar cada una
 * sugeriria que cada una lleva a un sitio distinto, y no puede: todas se apoyan
 * en las mismas derivaciones porque es lo unico que el pipeline sabe decir.
 *
 * Y con estado a la vista. Un foco del que solo se sale repitiendo el gesto que
 * lo encendio obliga a acordarse de cual fue; este dice en su etiqueta lo que
 * va a hacer.
 *
 * @param basis Derivaciones de las que sale la lectura.
 * @param isShown Cierto si el foco esta puesto.
 * @param onToggle Encender o apagar el foco.
 * @returns La linea, o nada si no se puede decir de donde sale.
 */
function ReadingBasis({ basis, isShown, onToggle }: ReadingBasisProps) {
  const theme = useTheme();

  if (basis === null) {
    return null;
  }

  return (
    <View style={styles.basis}>
      <Text style={[type.caption, { color: theme.textLow }]}>
        {STUDY_TEXT.basisLabel} {basis.join(' · ')}
      </Text>
      <ActionButton
        label={isShown ? STUDY_TEXT.hideBasis : STUDY_TEXT.showBasis}
        onPress={onToggle}
        variant="secondary"
      />
    </View>
  );
}

interface SignalViewProps {
  readonly study: QueuedStudy;
  readonly signal: EcgSignal | null;
  readonly focusedLeads: readonly LeadName[] | null;
}

/** El trazado, con el montaje y la calibracion con que se imprimio. */
function SignalView({ study, signal, focusedLeads }: SignalViewProps) {
  if (signal === null) {
    return null;
  }

  return (
    <TwelveLeadViewer
      signal={signal}
      mount={study.metadata.mount}
      calibration={study.metadata.calibration}
      focusedLeads={focusedLeads}
    />
  );
}

/**
 * Trazado, medidas y observaciones de un estudio ya procesado.
 *
 * TOCAR UNA OBSERVACION LLEVA EL FOCO A SUS DERIVACIONES. El estado vive aqui
 * porque aqui es donde el visor y la lista son hermanos, y ninguno de los dos
 * tiene por que saber del otro.
 */
function ReadyAnalysis({ study, analysis }: { study: QueuedStudy; analysis: EcgAnalysis }) {
  const [showBasis, setShowBasis] = useState(false);

  const { signal } = analysis;
  const basis = useMemo(() => readingBasis(signal, analysis.observations), [signal, analysis]);

  return (
    <View style={styles.ready}>
      <SettingsSection title={STUDY_TEXT.signalSection}>
        <SignalView study={study} signal={signal} focusedLeads={showBasis ? basis : null} />
      </SettingsSection>

      {analysis.measurements === null ? null : (
        <SettingsSection title={STUDY_TEXT.measurementsSection}>
          <MeasurementList measurements={analysis.measurements} />
        </SettingsSection>
      )}

      <SettingsSection title={STUDY_TEXT.observationsSection}>
        <ReadingBasis
          basis={basis}
          isShown={showBasis}
          onToggle={() => setShowBasis((on) => !on)}
        />
        <ObservationList observations={analysis.observations} />
      </SettingsSection>
    </View>
  );
}

interface AnalysisFailureProps {
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
 * Y AHORA TIENE SALIDA. Antes decia la causa y ahi se acababa la pantalla: la
 * unica forma de volver a intentarlo era cerrar la aplicacion, y ni siquiera
 * eso, porque el estudio ya constaba como pedido. La imagen sigue en el
 * dispositivo y el estudio sigue subido, asi que reintentar es barato y no
 * arriesga nada.
 *
 * SALIDA SOLO CUANDO LA HAY. El boton no aparece en las causas que no pueden
 * terminar de otra manera -- ver isWorthRetrying. En esas, lo que hay que hacer
 * lo dice el texto de la causa, y un boton al lado solo invita a pulsarlo en
 * lugar de leerlo.
 */
function AnalysisFailure({ studyId, analysis }: AnalysisFailureProps) {
  const theme = useTheme();
  const retry = useAnalyses((state) => state.retry);

  return (
    <View style={[styles.failure, { backgroundColor: theme.surface }]}>
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
  basis: { gap: gap.sm, marginBottom: gap.md },
  ready: { gap: gap.xl },
  failure: { padding: gap.lg, borderRadius: radius.tile, gap: gap.xs },
  // En fila para que el boton no se estire al ancho de la tarjeta: dentro de un
  // aviso, un boton a sangre pesa mas que el propio aviso.
  failureAction: { flexDirection: 'row', marginTop: gap.sm },
});
