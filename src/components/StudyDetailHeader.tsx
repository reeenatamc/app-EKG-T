import { StyleSheet, Text, View } from 'react-native';

import type { QueuedStudy } from '@/capture/study';
import { formatStudyDate } from '@/capture/studyDate';
import { IconButton } from '@/components/IconButton';
import { MOUNT_COPY } from '@/constants/captureText';
import { NAV_TEXT } from '@/constants/shellText';
import { cardShadow } from '@/design/elevation';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { font, type } from '@/design/type';

interface StudyDetailHeaderProps {
  readonly study: QueuedStudy;
  /** Salida de la pantalla. Obligatoria: el detalle es una pantalla apilada. */
  readonly onBack: () => void;
}

/**
 * Cabecera del detalle: salida a la izquierda y, a su lado, que registro es.
 *
 * EN FILA Y PEQUENA, no el titular grande de `ScreenHeader`. En el detalle lo que
 * manda es el resultado que va debajo; un titular de treinta y dos puntos le
 * disputaba la primera mirada. El montaje sigue siendo el titulo, porque es lo que
 * le dice al clinico que tiene delante, y el identificador va de etiqueta (D-30).
 *
 * @param study Estudio en cuestion.
 * @param onBack Salida de la pantalla.
 * @returns La cabecera.
 */
export function StudyDetailHeader({ study, onBack }: StudyDetailHeaderProps) {
  const theme = useTheme();
  const { capturedAt, mount, anonymousId } = study.metadata;

  return (
    <View style={styles.row}>
      <View style={[styles.back, cardShadow]}>
        <IconButton
          icon="back"
          label={NAV_TEXT.back}
          onPress={onBack}
          color={theme.textHigh}
          background={theme.surface}
        />
      </View>
      <View style={styles.identity}>
        <Text accessibilityRole="header" style={[styles.title, { color: theme.textHigh }]}>
          {MOUNT_COPY[mount].label}
        </Text>
        <Text style={[type.caption, { color: theme.textLow }]}>
          {anonymousId} · {formatStudyDate(capturedAt)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: gap.md },
  back: { borderRadius: radius.pill },
  identity: { flex: 1 },
  title: { ...type.data, fontFamily: font.semibold },
});
