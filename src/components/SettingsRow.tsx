import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { rowShadow } from '@/design/elevation';
import { useTheme } from '@/design/theme';
import { gap, radius } from '@/design/tokens';
import { type } from '@/design/type';

interface SettingsRowProps {
  readonly label: string;
  readonly hint?: string;
  /** Valor informativo, cuando la fila no es interactiva. */
  readonly value?: string;
  /** Control interactivo, cuando la fila si lo es. */
  readonly children?: ReactNode;
}

/**
 * Fila de ajustes.
 *
 * Admite dos formas: informativa, con un valor a la derecha, o interactiva, con
 * un control debajo. Una fila informativa no finge ser pulsable, que es lo que
 * pasa cuando se le pone apariencia de control a algo que no cambia nada.
 *
 * Se apoya en superficie opaca: los controles pierden contraste sobre vidrio
 * justo cuando hay que leer su estado.
 *
 * El valor usa la misma familia que el resto de la interfaz. Correo, rol e idioma
 * son prosa breve; cambiar de fuente los hacia parecer datos tecnicos.
 *
 * @param label Nombre del ajuste.
 * @param hint Aclaracion breve, opcional.
 * @param value Valor mostrado cuando la fila es informativa.
 * @param children Control, cuando la fila es interactiva.
 * @returns La fila renderizada.
 */
export function SettingsRow({ label, hint, value, children }: SettingsRowProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, rowShadow, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text style={[type.body, styles.label, { color: theme.textHigh }]}>{label}</Text>
        {value === undefined ? null : (
          <Text style={[type.body, { color: theme.textLow }]}>{value}</Text>
        )}
      </View>
      {hint === undefined ? null : (
        <Text style={[type.caption, { color: theme.textLow }]}>{hint}</Text>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { padding: gap.lg, borderRadius: radius.tile, borderCurve: 'continuous', gap: gap.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { flexShrink: 1, marginRight: gap.md },
});
