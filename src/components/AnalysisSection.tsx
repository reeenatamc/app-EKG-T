import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { ActionButton } from '@/components/ActionButton';
import { MeasurementList } from '@/components/MeasurementList';
import { ObservationList } from '@/components/ObservationList';
import { SegmentedControl } from '@/components/SegmentedControl';
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
    return <ProcessingSignal study={study} analysis={analysis} />;
  }

  if (analysis.status === 'failed') {
    // El identificador del servidor, no el del dispositivo: es el unico por el que
    // se le puede pedir nada. Pedir con el local devuelve 404, y desde fuera eso se
    // ve como un boton que no hace nada.
    return <AnalysisFailure study={study} studyId={study.remoteId} analysis={analysis} />;
  }

  return <ReadyAnalysis study={study} analysis={analysis} />;
}

/**
 * Mientras se procesa, con el trazado ya leido si lo hay.
 *
 * LA DIGITALIZACION ES LA MITAD RAPIDA, unos quince segundos, y la
 * interpretacion la lenta, de treinta a cincuenta y cinco. El servidor guarda
 * el trazado en cuanto lo digitaliza, mucho antes de que la interpretacion
 * termine, asi que aqui se ensena en cuanto llega en vez de esperar al final:
 * quien acaba de fotografiar el registro ve algo mientras el resto sigue en
 * marcha, no un indicador vacio todo ese tiempo.
 *
 * EL INDICADOR SE QUEDA, con o sin trazado. El trazado es un adelanto de lo
 * que se leyo, no el resultado: la interpretacion sigue en curso y todavia
 * puede fallar.
 */
function ProcessingSignal({ study, analysis }: { study: QueuedStudy; analysis: EcgAnalysis }) {
  const theme = useTheme();

  return (
    <View style={styles.processing}>
      {analysis.signal === null ? null : (
        <SettingsSection title={STUDY_TEXT.signalSection}>
          <Text style={[type.caption, { color: theme.textLow }]}>
            {STUDY_TEXT.signalReadCaption}
          </Text>
          <SignalView study={study} signal={analysis.signal} focusedLeads={null} />
        </SettingsSection>
      )}
      <ProcessingIndicator isQueued={false} />
    </View>
  );
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
      {/* En fila, como el de reintentar: a ancho completo pesaria mas que la lectura. */}
      <View style={styles.basisAction}>
        <ActionButton
          label={isShown ? STUDY_TEXT.hideBasis : STUDY_TEXT.showBasis}
          onPress={onToggle}
          variant="secondary"
        />
      </View>
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
  // Trazado o foto: la misma hoja vista dos veces. Poder saltar de una a otra es
  // lo que deja comprobar a ojo que lo digitalizado es lo que estaba en el papel.
  const [view, setView] = useState<'trace' | 'photo'>('trace');

  if (signal === null) {
    return null;
  }

  return (
    <View style={styles.signalView}>
      <SegmentedControl
        options={[
          { value: 'trace', label: STUDY_TEXT.viewTrace },
          { value: 'photo', label: STUDY_TEXT.viewPhoto },
        ]}
        value={view}
        onChange={setView}
        accessibilityLabel={STUDY_TEXT.viewSwitchLabel}
      />
      {view === 'photo' ? (
        <StudyPhoto study={study} />
      ) : (
        <TwelveLeadViewer
          signal={signal}
          mount={study.metadata.mount}
          calibration={study.metadata.calibration}
          focusedLeads={focusedLeads}
        />
      )}
    </View>
  );
}

/** La foto tal como se envio, a su proporcion, para cotejarla con el trazado. */
function StudyPhoto({ study }: { study: QueuedStudy }) {
  const theme = useTheme();

  return (
    <Image
      source={{ uri: study.imageUri }}
      style={[
        styles.photo,
        { aspectRatio: study.imageWidth / study.imageHeight, backgroundColor: theme.surface },
      ]}
      resizeMode="contain"
      accessibilityLabel={STUDY_TEXT.viewPhoto}
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
 *
 * Y CON EL TRAZADO SI LLEGO A DIGITALIZARSE. Un fallo tras la digitalizacion
 * -- un error del servidor en la interpretacion, un montaje no soportado que
 * salta la comprobacion cruzada-- no borra lo que ya se leyo del papel. Quien
 * hizo la foto ve el trazado igual, encima del aviso.
 */
function AnalysisFailure({ study, studyId, analysis }: AnalysisFailureProps) {
  const theme = useTheme();

  return (
    <View style={styles.failureWrap}>
      {analysis.signal === null ? null : (
        <SettingsSection title={STUDY_TEXT.signalSection}>
          <Text style={[type.caption, { color: theme.textLow }]}>
            {STUDY_TEXT.signalReadFailureCaption}
          </Text>
          <SignalView study={study} signal={analysis.signal} focusedLeads={null} />
        </SettingsSection>
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
  signalView: { gap: gap.sm },
  photo: { width: '100%', borderRadius: radius.tile },
  basis: { gap: gap.sm, marginBottom: gap.md },
  basisAction: { flexDirection: 'row' },
  ready: { gap: gap.xl },
  processing: { gap: gap.xl },
  failureWrap: { gap: gap.xl },
  failure: { padding: gap.lg, borderRadius: radius.tile, gap: gap.xs },
  // En fila para que el boton no se estire al ancho de la tarjeta: dentro de un
  // aviso, un boton a sangre pesa mas que el propio aviso.
  failureAction: { flexDirection: 'row', marginTop: gap.sm },
});
