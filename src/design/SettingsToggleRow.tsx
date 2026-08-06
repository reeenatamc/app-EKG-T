import { StyleSheet, Switch, Text, View } from 'react-native';

import { rowShadow } from '@/design/elevation';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface SettingsToggleRowProps {
  readonly label: string;
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
  /** Aclara que cambia el interruptor, para que no haya que probarlo para saberlo. */
  readonly hint?: string;
}

/**
 * Fila de ajuste con interruptor.
 *
 * Se apoya en superficie opaca: es un control, y un control sobre vidrio pierde
 * contraste justo cuando el usuario necesita leer su estado.
 *
 * SE DECLARA `thumbColor`. Sin el, Android pinta el pulgar con su verde de
 * sistema, que ni sale de `tokens.ts` ni es un color que esta aplicacion pueda
 * permitirse: el verde encendido es el vocabulario que `semantic.ok` tiene
 * reservado para la jerarquia de alarma. Se veia en la lamina de D.1, en
 * "Reducir movimiento".
 *
 * @param label Texto del ajuste.
 * @param value Estado actual.
 * @param onValueChange Se invoca con el nuevo estado.
 * @param hint Aclaracion breve, opcional.
 * @returns La fila renderizada.
 */
export function SettingsToggleRow({ label, value, onValueChange, hint }: SettingsToggleRowProps) {
  const theme = useTheme();

  return (
    <View style={[styles.row, rowShadow, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: theme.textHigh }]}>{label}</Text>
        <Switch
          accessibilityLabel={label}
          value={value}
          onValueChange={onValueChange}
          trackColor={{ true: theme.textHigh, false: theme.edge }}
          thumbColor={theme.surface}
        />
      </View>
      {hint === undefined ? null : (
        <Text style={[type.caption, { color: theme.textLow }]}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: size.touchTarget,
    justifyContent: 'center',
    paddingVertical: gap.sm,
    paddingHorizontal: gap.lg,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    gap: gap.xs,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { ...type.body, flexShrink: 1, marginRight: gap.md },
});
