import { StyleSheet, Text, View } from 'react-native';

import { MOUNT_COPY, QUEUE_TEXT, UPLOAD_FAILURE_COPY } from '@/constants/captureText';
import type { QueuedStudy, StudyStatus } from '@/capture/study';
import { ActionButton } from '@/components/ActionButton';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { type } from '@/design/type';

interface QueuedStudyRowProps {
  readonly study: QueuedStudy;
  readonly onRetry: (id: string) => void;
  readonly onDiscard: (id: string) => void;
}

const STATUS_LABEL: Record<StudyStatus, string> = {
  pending: QUEUE_TEXT.pending,
  uploading: QUEUE_TEXT.uploading,
  failed: QUEUE_TEXT.failed,
  uploaded: QUEUE_TEXT.uploaded,
};

/**
 * Un estudio de la cola, con su estado y sus salidas.
 *
 * El estado va escrito, no codificado por color: §12.3 no admite el color como
 * unico portador de significado, y ademas el color que pediria "fallido" es el
 * rojo de alarma, que esta reservado.
 *
 * Cuando algo falla se dice la causa y que va a pasar con el estudio. Que la
 * foto sigue guardada es la informacion que importa: quien acaba de fotografiar
 * un registro necesita saber que su trabajo no se ha perdido antes que saber
 * por que fallo la red.
 *
 * @param study Estudio de la cola.
 * @param onRetry Reintenta el envio.
 * @param onDiscard Descarta el estudio y borra su imagen.
 * @returns La fila del estudio.
 */
export function QueuedStudyRow({ study, onRetry, onDiscard }: QueuedStudyRowProps) {
  const theme = useTheme();
  const hasFailed = study.status === 'failed';

  return (
    <View style={[styles.row, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text style={[type.body, { color: theme.textHigh }]}>{study.metadata.anonymousId}</Text>
        <Text style={[type.caption, { color: theme.textLow }]}>{STATUS_LABEL[study.status]}</Text>
      </View>

      <Text style={[type.caption, { color: theme.textLow }]}>
        {MOUNT_COPY[study.metadata.mount].label}
      </Text>

      {hasFailed && study.lastFailure !== null ? (
        <Text style={[type.caption, { color: theme.textHigh }]}>
          {UPLOAD_FAILURE_COPY[study.lastFailure]}
        </Text>
      ) : null}

      {hasFailed ? (
        <FailedStudyActions
          onRetry={() => onRetry(study.id)}
          onDiscard={() => onDiscard(study.id)}
        />
      ) : null}
    </View>
  );
}

interface FailedStudyActionsProps {
  readonly onRetry: () => void;
  readonly onDiscard: () => void;
}

/**
 * Las dos salidas de un estudio que no salio.
 *
 * Solo aparecen cuando hacen falta. Un boton de reintentar junto a un estudio
 * que se esta enviando invitaria a pulsarlo y a duplicar el trabajo.
 */
function FailedStudyActions({ onRetry, onDiscard }: FailedStudyActionsProps) {
  return (
    <View style={styles.actions}>
      <ActionButton label={QUEUE_TEXT.retry} onPress={onRetry} variant="primary" />
      <ActionButton label={QUEUE_TEXT.discard} onPress={onDiscard} variant="secondary" />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { padding: gap.lg, borderRadius: radius.tile, gap: gap.xs },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: gap.md, marginTop: gap.sm },
});
