import { StyleSheet, Text, View } from 'react-native';

import { ActionButton } from '@/components/ActionButton';
import { Background } from '@/design/Background';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

interface NoticeAction {
  readonly label: string;
  readonly onPress: () => void;
}

interface CameraPermissionNoticeProps {
  readonly title: string;
  readonly body: string;
  /** Nulo mientras se comprueba el permiso, cuando no hay nada que el usuario pueda hacer. */
  readonly action: NoticeAction | null;
}

/**
 * Mensaje a pantalla completa sobre el estado del permiso de camara.
 *
 * Es presentacional: no consulta ni solicita permisos. Esa decision vive en
 * CameraPermissionGate, de modo que este componente sirve igual para el estado
 * de comprobacion, el de solicitud y el de denegacion definitiva.
 *
 * @param title Titulo breve del estado.
 * @param body Explicacion de por que la aplicacion necesita la camara.
 * @param action Accion ofrecida al usuario, o null si no procede ninguna.
 * @returns El mensaje renderizado.
 */
export function CameraPermissionNotice({ title, body, action }: CameraPermissionNoticeProps) {
  const theme = useTheme();

  return (
    <Background>
      <View style={styles.container}>
        <Text style={[styles.title, { color: theme.textHigh }]}>{title}</Text>
        <Text style={[styles.body, { color: theme.textLow }]}>{body}</Text>

        {action === null ? null : (
          <View style={styles.actionRow}>
            <ActionButton label={action.label} onPress={action.onPress} variant="primary" />
          </View>
        )}
      </View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: gap.xl,
  },
  title: { ...type.h1, textAlign: 'center' },
  body: { ...type.body, marginTop: gap.md, textAlign: 'center' },
  actionRow: {
    flexDirection: 'row',
    marginTop: gap.xl,
    alignSelf: 'stretch',
    paddingHorizontal: gap.xl,
  },
});
