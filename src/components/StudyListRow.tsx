import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { MOUNT_COPY, QUEUE_TEXT, UPLOAD_FAILURE_COPY } from '@/constants/captureText';
import { STATUS_TEXT } from '@/constants/studyText';
import { useAnalyses } from '@/ecg/analyses';
import { rowShadow } from '@/design/elevation';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

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
 * Solo se puede abrir un estudio que ya se envio. Antes de eso no hay nada que
 * mirar, y un toque que no lleva a ningun sitio se lee como una averia.
 *
 * EL IDENTIFICADOR Y LA FECHA VAN EN MONOESPACIADA. Iban en Inter, que es lo que
 * D.1 dejo por escrito como el error al reves: la monoespaciada se gastaba en
 * prosa y las cifras iban en la familia de prosa. Aqui la anchura constante del
 * digito hace que una columna de identificadores y fechas se lea como una
 * columna y no como un parrafo desalineado.
 *
 * @param study Estudio de la fila.
 * @returns La fila del historial.
 */
export function StudyListRow({ study }: StudyListRowProps) {
  const theme = useTheme();
  const router = useRouter();
  const analysis = useAnalyses((state) => state.byStudy[study.id]);

  const isSent = study.status === 'uploaded';
  const status = isSent && analysis !== undefined ? STATUS_TEXT[analysis.status] : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${study.metadata.anonymousId}. ${status ?? QUEUE_TEXT[study.status]}`}
      disabled={!isSent}
      onPress={() => router.push(`/study/${study.id}`)}
      style={[styles.row, rowShadow, { backgroundColor: theme.surface }]}
    >
      <RowContent study={study} status={status ?? QUEUE_TEXT[study.status]} />
    </Pressable>
  );
}

interface RowContentProps {
  readonly study: QueuedStudy;
  readonly status: string;
}

/** Identificador, estado, fecha y montaje. */
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

const styles = StyleSheet.create({
  row: {
    minHeight: size.touchTarget,
    padding: gap.lg,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    gap: gap.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
