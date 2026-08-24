import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/design/theme';
import { gap, radius, semantic, size } from '@/design/tokens';
import { type } from '@/design/type';

interface NoticeProps {
  /** Que ha pasado, en una linea. */
  readonly title: string;
  /** Que puede hacer quien lo lee. Nunca una disculpa ni un codigo de error. */
  readonly action: string;
}

/**
 * Aviso en linea de que algo no salio.
 *
 * Se apoya en superficie opaca y lleva barra lateral ademas de color, porque
 * §12.3 no admite el color como unico portador de significado.
 *
 * ES LA UNICA FORMA QUE TIENE LA APLICACION DE DECIR QUE ALGO FALLO. Antes este
 * cuerpo vivia dentro de `ErrorNotice`, atado al vocabulario de la
 * autenticacion, asi que las acciones de fuera —recortar, exportar— no tenian
 * donde avisar y acababan fallando solo en consola. Separar la presentacion de
 * la traduccion de causas deja a las dos reutilizables.
 *
 * RECIBE TEXTO YA RESUELTO, no una causa. Quien lo monta elige el copy de su
 * modulo, que es lo que impide que un mensaje del servidor llegue a pantalla:
 * ninguna cadena de aqui viene de la red.
 *
 * @param title Que ha pasado.
 * @param action Que se puede hacer.
 * @returns El aviso.
 */
export function Notice({ title, action }: NoticeProps) {
  const theme = useTheme();

  return (
    <View accessibilityRole="alert" style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.bar} />
      <View style={styles.body}>
        <Text style={[type.body, { color: theme.textHigh }]}>{title}</Text>
        <Text style={[type.caption, { color: theme.textLow }]}>{action}</Text>
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
