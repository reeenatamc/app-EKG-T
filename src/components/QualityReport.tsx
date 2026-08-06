import { StyleSheet, Text, View } from 'react-native';

import type { QualityFinding } from '@/camera/quality';
import { CONFIRM_TEXT, QUALITY_COPY } from '@/constants/captureText';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface QualityReportProps {
  readonly findings: readonly QualityFinding[];
  /** Cierto mientras el analisis sigue en marcha. */
  readonly isAnalyzing: boolean;
}

/**
 * Lo que el control de calidad encontro en la foto.
 *
 * ADVIERTE, NO BLOQUEA. La nota que lo dice esta siempre a la vista cuando hay
 * hallazgos, y el boton de enviar sigue activo. Quien captura puede estar en
 * una guardia con la luz que hay y una sola oportunidad de fotografiar esa
 * hoja; negarse a enviarla no protege a nadie.
 *
 * NO SE USA COLOR DE ESTADO. Lo natural seria pintar los avisos de ambar, pero
 * el ambar de aviso es semantic.alarmMedium, reservado a la jerarquia de alarma
 * de la IEC 60601-1-8. Que una foto con reflejo comparta color con una alarma
 * fisiologica de prioridad media es exactamente la confusion que §12 evita. Se
 * distingue con un acento decorativo y, sobre todo, con el texto.
 *
 * @param findings Defectos encontrados, en orden de gravedad.
 * @param isAnalyzing Cierto mientras se esta midiendo.
 * @returns El informe de calidad.
 */
export function QualityReport({ findings, isAnalyzing }: QualityReportProps) {
  const theme = useTheme();

  if (isAnalyzing) {
    return null;
  }

  if (findings.length === 0) {
    return (
      <Text style={[type.caption, { color: theme.textLow }]}>{CONFIRM_TEXT.qualityClean}</Text>
    );
  }

  return (
    <View style={styles.list}>
      {findings.map((finding) => (
        <QualityFindingCard key={finding.issue} finding={finding} />
      ))}

      <Text style={[type.caption, { color: theme.textLow }]}>
        {CONFIRM_TEXT.qualityWarningNote}
      </Text>
    </View>
  );
}

/**
 * Un defecto, contado en tres lineas: que pasa, por que importa y que hacer.
 *
 * Las tres hacen falta. Sin la segunda el aviso se ignora por incomprensible;
 * sin la tercera, por inutil.
 */
function QualityFindingCard({ finding }: { readonly finding: QualityFinding }) {
  const theme = useTheme();
  const copy = QUALITY_COPY[finding.issue];

  return (
    <View
      style={[
        styles.finding,
        // Retícula gruesa como acento: ni marca ni alarma. Antes era un blob del
        // aurora, y el aurora ya no sale del lienzo.
        { backgroundColor: theme.surface, borderLeftColor: theme.gridBold },
      ]}
      accessibilityLabel={`${copy.title}. ${copy.why} ${copy.action}`}
    >
      <Text style={[type.body, { color: theme.textHigh }]}>{copy.title}</Text>
      <Text style={[type.caption, { color: theme.textLow }]}>{copy.why}</Text>
      <Text style={[type.caption, { color: theme.textHigh }]}>{copy.action}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: gap.sm },
  finding: {
    padding: gap.lg,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    borderLeftWidth: size.frameBorder,
    gap: gap.xs,
  },
});
