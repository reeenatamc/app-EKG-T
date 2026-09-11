import { Children, Fragment, isValidElement, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';

import { FORM_ICON_PATHS, FORM_ICON_VIEWBOX } from '@/components/icons/formIcons';
import { LineIcon } from '@/components/icons/LineIcon';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

/**
 * Filas de un mismo bloque sobre una sola superficie, separadas por filos.
 *
 * UNA SUPERFICIE Y NO UNA PASTILLA POR FILA. El perfil eran dos pastillas con
 * sombra y un boton, cada una flotando por su cuenta: tres objetos para dos datos.
 * Agrupadas, las filas se leen como lo que son —partes de una misma ficha— y el
 * ojo recorre la lista sin saltar de caja en caja. Es la forma que ya tiene la
 * tabla de observaciones del detalle.
 *
 * El filo entre filas empieza donde empieza el texto y no en el borde, para que
 * separe filas sin cortar el bloque en trozos.
 *
 * @param children Las filas, en orden.
 * @returns El bloque.
 */
export function GroupedList({ children }: { readonly children: ReactNode }) {
  const theme = useTheme();
  const rows = Children.toArray(children);

  return (
    <View style={[styles.list, { backgroundColor: theme.surface, borderColor: theme.edge }]}>
      {rows.map((row, index) => (
        <Fragment key={isValidElement(row) && row.key !== null ? row.key : index}>
          {index === 0 ? null : <View style={[styles.divider, { backgroundColor: theme.edge }]} />}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

interface InfoRowProps {
  readonly label: string;
  readonly value: string;
  /** Monoespaciada, cuando el valor es una cifra o una fecha (§6). */
  readonly isFigure?: boolean;
}

/** Una fila que solo informa: nombre a la izquierda y valor a la derecha. */
export function GroupedInfoRow({ label, value, isFigure = false }: InfoRowProps) {
  const theme = useTheme();

  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} style={styles.row}>
      <Text style={[type.body, styles.label, { color: theme.textHigh }]}>{label}</Text>
      <Text style={[isFigure ? type.data : type.body, { color: theme.textLow }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

interface ToggleRowProps {
  readonly label: string;
  readonly value: boolean;
  readonly onValueChange: (value: boolean) => void;
}

/**
 * Una fila con interruptor.
 *
 * El pulgar se declara por lo mismo que en `SettingsToggleRow`: sin el, Android lo
 * pinta con su verde de sistema, que es el vocabulario reservado a la alarma.
 */
export function GroupedToggleRow({ label, value, onValueChange }: ToggleRowProps) {
  const theme = useTheme();

  return (
    <View style={styles.row}>
      <Text style={[type.body, styles.label, { color: theme.textHigh }]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: theme.textHigh, false: theme.edge }}
        thumbColor={theme.surface}
      />
    </View>
  );
}

/** Una fila con un control debajo del nombre, para los que no caben al lado. */
export function GroupedControlRow({
  label,
  hint,
  children,
}: {
  readonly label: string;
  readonly hint?: string;
  readonly children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View style={styles.stacked}>
      <Text style={[type.body, { color: theme.textHigh }]}>{label}</Text>
      {hint === undefined ? null : (
        <Text style={[type.caption, { color: theme.textLow }]}>{hint}</Text>
      )}
      {children}
    </View>
  );
}

interface LinkRowProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly hint?: string;
  /** La flecha dice «lleva a otra pantalla». Una accion que no navega no la lleva. */
  readonly leadsSomewhere?: boolean;
}

/**
 * Una fila que se pulsa.
 *
 * ACUSA EL DEDO OSCURECIENDO LA FILA, no encogiendola. El muelle de los botones
 * mueve un objeto suelto; aqui la fila es parte de un bloque, y encoger una sola
 * la despegaria de sus vecinas.
 */
export function GroupedLinkRow({ label, onPress, hint, leadsSomewhere = true }: LinkRowProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole={leadsSomewhere ? 'link' : 'button'}
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? { backgroundColor: theme.canvas } : null]}
    >
      <View style={styles.label}>
        <Text style={[type.body, { color: theme.textHigh }]}>{label}</Text>
        {hint === undefined ? null : (
          <Text style={[type.caption, { color: theme.textLow }]}>{hint}</Text>
        )}
      </View>
      {leadsSomewhere ? (
        <LineIcon
          path={FORM_ICON_PATHS.chevron}
          color={theme.textLow}
          viewBox={FORM_ICON_VIEWBOX}
          side={size.fieldIcon}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    borderWidth: size.hairline,
    overflow: 'hidden',
  },
  divider: { height: size.hairline, marginLeft: gap.lg },
  row: {
    minHeight: size.touchTarget + gap.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: gap.md,
    paddingHorizontal: gap.lg,
    paddingVertical: gap.sm,
  },
  stacked: { gap: gap.sm, paddingHorizontal: gap.lg, paddingVertical: gap.md },
  label: { flex: 1 },
});
