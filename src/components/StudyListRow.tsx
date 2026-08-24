import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { studyActions, type StudyActions } from '@/capture/studyActions';
import { useUploadQueue } from '@/capture/uploadQueue';
import { ActionButton } from '@/components/ActionButton';
import { MOUNT_COPY, QUEUE_TEXT, UPLOAD_FAILURE_COPY } from '@/constants/captureText';
import { STATUS_TEXT } from '@/constants/studyText';
import { useAnalyses } from '@/ecg/analyses';
import { rowShadow } from '@/design/elevation';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';

interface StudyListRowProps {
  readonly study: QueuedStudy;
}

/**
 * Una fila del historial.
 *
 * CERO VIDRIO AQUI DENTRO, y no es una preferencia estetica. Cada BlurView es
 * una pasada de desenfoque sobre lo que tiene detras; en una lista que recicla
 * filas al desplazarse, eso se paga en cada fotograma de cada fila visible.
 * §3 da un presupuesto de dos superficies por pantalla y la barra de pestanas
 * ya gasta una: una lista de vidrio se lo saltaria por fila.
 *
 * LA SUPERFICIE ES LA DE FUERA Y EL BOTON EL DE DENTRO, en ese orden y no al
 * reves. Antes la fila entera era un `Pressable` desactivado cuando el estudio
 * no se habia enviado, y en React Native un pulsable desactivado **se traga los
 * toques de sus hijos**: cualquier boton dentro de una fila fallida habria sido
 * inerte. Con la tarjeta como `View` y el pulsable dentro, las salidas del
 * estudio atascado quedan fuera de su alcance y funcionan.
 *
 * Que se puede hacer con cada estudio lo decide `studyActions`, que es puro y
 * esta probado.
 *
 * @param study Estudio de la fila.
 * @returns La fila del historial.
 */
export function StudyListRow({ study }: StudyListRowProps) {
  const theme = useTheme();
  const actions = studyActions(study);

  return (
    <View style={[styles.row, rowShadow, { backgroundColor: theme.surface }]}>
      <StudyOpener study={study} canOpen={actions.canOpen} />
      <StuckStudyActions study={study} actions={actions} />
    </View>
  );
}

/**
 * El cuerpo de la fila, pulsable solo si hay detalle que abrir.
 *
 * Solo se hunde el que se puede abrir. Un bloque que responde al dedo y no
 * lleva a ningun sitio promete algo que no cumple.
 *
 * Cuando no lo hay se renderiza como bloque y no como boton desactivado: un
 * boton en gris invita a insistir, y ademas un lector de pantalla lo anunciaria
 * como control cuando ahi no hay ningun control. Se marca `accessible` para que
 * las tres lineas se lean como una sola fila y no como tres textos sueltos.
 */
function StudyOpener({
  study,
  canOpen,
}: {
  readonly study: QueuedStudy;
  readonly canOpen: boolean;
}) {
  const analysis = useAnalyses((state) => state.byStudy[study.id]);
  const status = canOpen && analysis !== undefined ? STATUS_TEXT[analysis.status] : null;
  const shown = status ?? QUEUE_TEXT[study.status];
  const label = `${study.metadata.anonymousId}. ${shown}`;

  if (!canOpen) {
    return (
      <View accessible accessibilityLabel={label} style={styles.opener}>
        <RowContent study={study} status={shown} />
      </View>
    );
  }

  return <OpenableRow study={study} status={shown} label={label} />;
}

interface OpenableRowProps {
  readonly study: QueuedStudy;
  readonly status: string;
  readonly label: string;
}

/**
 * La fila de un estudio que ya se puede leer.
 *
 * Separada para que `usePressMotion` solo se llame donde hace falta: en la otra
 * rama no hay pulsable que hundir, y un gancho antes de un return condicional
 * tendria que ejecutarse igual.
 *
 * @param study Estudio de la fila.
 * @param status Estado ya traducido a texto.
 * @param label Etiqueta accesible de la fila entera.
 * @returns La fila pulsable.
 */
function OpenableRow({ study, status, label }: OpenableRowProps) {
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
      <RowContent study={study} status={status} />
    </AnimatedPressable>
  );
}

interface RowContentProps {
  readonly study: QueuedStudy;
  readonly status: string;
}

/**
 * Identificador, estado, fecha y montaje.
 *
 * EL IDENTIFICADOR Y LA FECHA VAN EN MONOESPACIADA. Iban en Inter, que es lo que
 * D.1 dejo por escrito como el error al reves: la monoespaciada se gastaba en
 * prosa y las cifras iban en la familia de prosa. Aqui la anchura constante del
 * digito hace que una columna de identificadores y fechas se lea como una
 * columna y no como un parrafo desalineado.
 */
function RowContent({ study, status }: RowContentProps) {
  const theme = useTheme();

  return (
    <>
      <View style={styles.header}>
        <Text style={[type.data, { color: theme.textHigh }]}>{study.metadata.anonymousId}</Text>
        <Text style={[type.caption, { color: theme.textLow }]}>{status}</Text>
      </View>

      <Text style={[type.data, { color: theme.textLow }]}>
        {new Date(study.metadata.capturedAt).toLocaleDateString()} ·{' '}
        {MOUNT_COPY[study.metadata.mount].label}
      </Text>

      {study.status === 'failed' && study.lastFailure !== null ? (
        <Text style={[type.caption, { color: theme.textHigh }]}>
          {UPLOAD_FAILURE_COPY[study.lastFailure]}
        </Text>
      ) : null}
    </>
  );
}

interface StuckStudyActionsProps {
  readonly study: QueuedStudy;
  readonly actions: StudyActions;
}

/**
 * Las dos salidas de un estudio que no salio.
 *
 * Solo aparecen cuando hacen falta: un boton de reintentar junto a un estudio
 * que se esta enviando invitaria a pulsarlo y a duplicar el trabajo.
 *
 * DESCARTAR AVISA ANTES DE QUE SE PULSE. Borra la foto del dispositivo y no hay
 * vuelta atras, asi que la consecuencia se lee encima del boton y no despues en
 * un dialogo: un dialogo de confirmacion se acepta sin leerlo.
 */
function StuckStudyActions({ study, actions }: StuckStudyActionsProps) {
  const theme = useTheme();
  const retryStudy = useUploadQueue((state) => state.retryStudy);
  const discard = useUploadQueue((state) => state.discard);

  if (!actions.canRetry && !actions.canDiscard) {
    return null;
  }

  return (
    <View style={styles.actions}>
      <Text style={[type.caption, { color: theme.textLow }]}>{QUEUE_TEXT.discardedNote}</Text>
      <View style={styles.buttons}>
        {actions.canRetry ? (
          <ActionButton
            label={QUEUE_TEXT.retry}
            onPress={() => retryStudy(study.id)}
            variant="primary"
          />
        ) : null}
        {actions.canDiscard ? (
          <ActionButton
            label={QUEUE_TEXT.discard}
            onPress={() => discard(study.id)}
            variant="secondary"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { borderRadius: radius.tile, borderCurve: 'continuous' },
  // El relleno vive en el pulsable y no en la tarjeta: asi el area tactil llega
  // hasta el filo de la fila en lugar de dejar dieciseis puntos muertos.
  opener: { minHeight: size.touchTarget, padding: gap.lg, gap: gap.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { paddingHorizontal: gap.lg, paddingBottom: gap.lg, gap: gap.sm },
  buttons: { flexDirection: 'row', gap: gap.md },
});
