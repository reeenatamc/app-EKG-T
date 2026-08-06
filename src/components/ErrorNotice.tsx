import { StyleSheet, Text, View } from 'react-native';

import type { AuthFailureReason } from '@/auth/AuthService';
import { AUTH_ERROR_COPY } from '@/constants/authText';
import { useTheme } from '@/design/theme';
import { gap, radius, semantic, size } from '@/design/tokens';
import { type } from '@/design/type';

interface ErrorNoticeProps {
  readonly reason: AuthFailureReason | null;
}

/**
 * Aviso de error de un formulario.
 *
 * Recibe una causa, nunca un texto: el copy vive en AUTH_ERROR_COPY, de modo
 * que ningun codigo de estado ni mensaje del servidor puede acabar en pantalla.
 * Cada aviso dice que paso y que hacer, y no culpa a la persona.
 *
 * Se apoya en superficie opaca y lleva barra lateral ademas de color, porque
 * §12.3 no admite el color como unico portador de significado.
 *
 * @param reason Causa del fallo, o null si no hay error que mostrar.
 * @returns El aviso, o null.
 */
export function ErrorNotice({ reason }: ErrorNoticeProps) {
  const theme = useTheme();

  if (reason === null) {
    return null;
  }

  const copy = AUTH_ERROR_COPY[reason];

  return (
    <View accessibilityRole="alert" style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.bar} />
      <View style={styles.body}>
        <Text style={[type.body, { color: theme.textHigh }]}>{copy.title}</Text>
        <Text style={[type.caption, { color: theme.textLow }]}>{copy.action}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  // Barra lateral: el significado no puede depender solo del color (§12.3).
  bar: { width: size.frameBorder, backgroundColor: semantic.alarmMedium },
  body: { flex: 1, padding: gap.lg, gap: gap.xs },
});
