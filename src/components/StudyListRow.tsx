import { useRouter } from 'expo-router';
import { Alert, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable, {
  type SwipeableMethods,
} from 'react-native-gesture-handler/ReanimatedSwipeable';

import { deleteStudy } from '@/capture/deleteStudy';
import type { QueuedStudy } from '@/capture/study';
import { studyActions } from '@/capture/studyActions';
import { formatStudyDate } from '@/capture/studyDate';
import { studyState, type StudyState } from '@/capture/studyState';
import { useUploadQueue } from '@/capture/uploadQueue';
import { ActionButton } from '@/components/ActionButton';
import { SwipeDeleteAction } from '@/components/SwipeDeleteAction';
import { MOUNT_COPY, QUEUE_TEXT, UPLOAD_FAILURE_COPY } from '@/constants/captureText';
import {
  ANALYSIS_FAILURE_COPY,
  DELETE_STUDY_TEXT,
  STATUS_DETAIL,
  STUDY_STATE_TEXT,
} from '@/constants/studyText';
import { useAnalyses } from '@/ecg/analyses';
import type { EcgAnalysis } from '@/ecg/EcgAnalysisService';
import { rowShadow } from '@/design/elevation';
import { useTheme } from '@/design/theme';
import { gap, radius, size, studyTone } from '@/design/tokens';
import { font, type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';

interface StudyListRowProps {
  readonly study: QueuedStudy;
}

/**
 * Una fila del historial.
 *
 * CERO VIDRIO AQUI DENTRO. Cada BlurView es una pasada de desenfoque sobre lo que
 * tiene detras, y en una lista que recicla filas al desplazarse eso se paga en
 * cada fotograma de cada fila visible. La barra de pestanas ya gasta el vidrio de
 * la pantalla.
 *
 * DESLIZAR HACIA LA DERECHA REVELA ELIMINAR, en lo que ya se envio y en lo que no
 * salio. Un estudio con lectura fallida no tenia ninguna salida: reintentar no
 * cambia el resultado de la misma imagen, y se quedaba estorbando para siempre.
 * Lo que se esta enviando no se desliza —lee su imagen en ese momento—, y lo que
 * espera turno tampoco, porque la cola puede cogerlo mientras se decide.
 *
 * El gesto no es la unica puerta: la fila ofrece eliminar como accion de
 * accesibilidad, porque un lector de pantalla no desliza.
 *
 * @param study Estudio de la fila.
 * @returns La fila del historial.
 */
export function StudyListRow({ study }: StudyListRowProps) {
  const actions = studyActions(study);
  const canDelete = actions.canDiscard || actions.canRemove;

  if (!canDelete) {
    return <StudyCard study={study} canOpen={actions.canOpen} canRetry={actions.canRetry} />;
  }

  return (
    <ReanimatedSwipeable
      friction={2}
      leftThreshold={40}
      overshootLeft={false}
      renderLeftActions={(_progress, _translation, methods) => (
        <SwipeDeleteAction onPress={() => confirmDelete(study, methods)} />
      )}
    >
      <StudyCard
        study={study}
        canOpen={actions.canOpen}
        canRetry={actions.canRetry}
        onDelete={() => confirmDelete(study, null)}
      />
    </ReanimatedSwipeable>
  );
}

/**
 * Pregunta antes de eliminar, y dice que se pierde.
 *
 * El texto depende de si el estudio llego a enviarse: uno sin enviar se lleva la
 * unica copia de la foto, uno enviado solo desaparece de este telefono. Al
 * cancelar, la fila vuelve a su sitio.
 *
 * @param study Estudio a eliminar.
 * @param methods Control de la fila deslizada, o null si no se llego deslizando.
 */
function confirmDelete(study: QueuedStudy, methods: SwipeableMethods | null): void {
  const close = () => methods?.close();

  Alert.alert(
    DELETE_STUDY_TEXT.title,
    study.status === 'uploaded' ? DELETE_STUDY_TEXT.removeBody : DELETE_STUDY_TEXT.discardBody,
    [
      { text: DELETE_STUDY_TEXT.cancel, style: 'cancel', onPress: close },
      {
        text: DELETE_STUDY_TEXT.confirm,
        style: 'destructive',
        onPress: () => deleteStudy(study.id),
      },
    ],
    { cancelable: true, onDismiss: close },
  );
}

interface StudyCardProps {
  readonly study: QueuedStudy;
  readonly canOpen: boolean;
  readonly canRetry: boolean;
  /** Eliminar sin deslizar, para lectores de pantalla. */
  readonly onDelete?: () => void;
}

/**
 * La tarjeta: el contenido, pulsable si hay detalle, y reintentar si el envio fallo.
 *
 * LA SUPERFICIE ES LA DE FUERA Y EL BOTON EL DE DENTRO. Un pulsable desactivado se
 * traga los toques de sus hijos, asi que la tarjeta es una vista y el pulsable va
 * dentro: el boton de reintentar de un estudio atascado sigue funcionando.
 */
function StudyCard({ study, canOpen, canRetry, onDelete }: StudyCardProps) {
  const theme = useTheme();
  const retryStudy = useUploadQueue((state) => state.retryStudy);
  const analysis = useAnalyses((state) =>
    study.remoteId === null ? undefined : state.byStudy[study.remoteId],
  );
  const state = studyState(study.status, analysis);

  return (
    <View
      style={[styles.card, rowShadow, { backgroundColor: theme.surface, borderColor: theme.edge }]}
      accessibilityActions={
        onDelete === undefined ? undefined : [{ name: 'delete', label: DELETE_STUDY_TEXT.confirm }]
      }
      onAccessibilityAction={() => onDelete?.()}
    >
      <StudyOpener study={study} analysis={analysis} state={state} canOpen={canOpen} />
      {canRetry ? (
        <View style={styles.retry}>
          <ActionButton
            label={QUEUE_TEXT.retry}
            onPress={() => retryStudy(study.id)}
            variant="primary"
          />
        </View>
      ) : null}
    </View>
  );
}

interface StudyOpenerProps {
  readonly study: QueuedStudy;
  readonly analysis: EcgAnalysis | undefined;
  readonly state: StudyState;
  readonly canOpen: boolean;
}

/**
 * El cuerpo de la tarjeta, pulsable solo si hay detalle que abrir.
 *
 * Cuando no lo hay es un bloque y no un boton desactivado: un boton en gris invita
 * a insistir, y un lector de pantalla lo anunciaria como control sin serlo.
 */
function StudyOpener({ study, analysis, state, canOpen }: StudyOpenerProps) {
  const label = `${MOUNT_COPY[study.metadata.mount].label}. ${STUDY_STATE_TEXT[state]}`;

  if (!canOpen) {
    return (
      <View accessible accessibilityLabel={label} style={styles.opener}>
        <RowContent study={study} analysis={analysis} state={state} />
      </View>
    );
  }

  return <OpenableRow study={study} analysis={analysis} state={state} label={label} />;
}

/** La tarjeta de un estudio que ya se puede abrir. */
function OpenableRow({
  study,
  analysis,
  state,
  label,
}: Omit<StudyOpenerProps, 'canOpen'> & { readonly label: string }) {
  const router = useRouter();
  const press = usePressMotion();

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => router.push(`/study/${study.id}`)}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.opener, press.style]}
    >
      <RowContent study={study} analysis={analysis} state={state} />
    </AnimatedPressable>
  );
}

/**
 * Montaje y estado arriba; identificador y fecha debajo; la causa si fallo.
 *
 * EL MONTAJE ES EL TITULO Y EL IDENTIFICADOR VA DEBAJO. El identificador es una
 * cadena tecnica; lo que le dice al profesional que estudio es cada fila es el
 * tipo de registro y cuando se tomo. Identificador y fecha van en Inter, como el
 * resto del historial.
 */
function RowContent({ study, analysis, state }: Omit<StudyOpenerProps, 'canOpen'>) {
  const theme = useTheme();
  const cause = failureCause(study, analysis, state);

  return (
    <>
      <View style={styles.titleRow}>
        <Text style={[type.body, styles.title, { color: theme.textHigh }]} numberOfLines={1}>
          {MOUNT_COPY[study.metadata.mount].label}
        </Text>
        <StateBadge state={state} />
      </View>
      <Text style={[type.caption, { color: theme.textLow }]} numberOfLines={1}>
        {study.metadata.anonymousId} · {formatStudyDate(study.metadata.capturedAt)}
      </Text>
      {cause === null ? null : (
        <Text style={[type.caption, { color: theme.textLow }]} numberOfLines={2}>
          {cause}
        </Text>
      )}
    </>
  );
}

/**
 * El estado: un punto y su nombre, en el tono del estado.
 *
 * El punto nunca va solo. Analizando y con error tienen casi la misma
 * luminosidad, y solo el texto los separa para quien no distingue el tono.
 */
function StateBadge({ state }: { readonly state: StudyState }) {
  const theme = useTheme();
  const tone = studyTone[theme.mode === 'dark' ? 'dark' : 'light'][state];

  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: tone }]} />
      <Text style={[type.caption, { color: tone }]}>{STUDY_STATE_TEXT[state]}</Text>
    </View>
  );
}

/**
 * Por que no salio, si no salio.
 *
 * @param study Estudio de la fila.
 * @param analysis Su analisis, si se conoce.
 * @param state Estado ya resuelto.
 * @returns La causa en texto, o null si no hay fallo que contar.
 */
function failureCause(
  study: QueuedStudy,
  analysis: EcgAnalysis | undefined,
  state: StudyState,
): string | null {
  if (state !== 'failed') {
    return null;
  }
  if (study.status === 'failed') {
    return study.lastFailure === null ? null : UPLOAD_FAILURE_COPY[study.lastFailure];
  }

  const reason = analysis?.failure ?? null;

  return reason === null ? STATUS_DETAIL.failed : ANALYSIS_FAILURE_COPY[reason];
}

const styles = StyleSheet.create({
  // Superficie blanca sobre lienzo gris ciruela, con sombra discreta.
  card: { borderRadius: radius.tile, borderCurve: 'continuous' },
  // El relleno vive en el pulsable y no en la tarjeta: asi el area tactil llega
  // hasta el filo de la fila en lugar de dejar dieciseis puntos muertos.
  opener: { minHeight: size.touchTarget, padding: gap.lg, gap: gap.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: gap.md },
  title: { flex: 1, fontFamily: font.medium },
  badge: { flexDirection: 'row', alignItems: 'center', gap: gap.xs },
  dot: { width: gap.sm, height: gap.sm, borderRadius: radius.pill },
  retry: { flexDirection: 'row', paddingHorizontal: gap.lg, paddingBottom: gap.lg },
});
