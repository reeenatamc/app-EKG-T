import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { authService } from '@/auth/service';
import { useAuthAction } from '@/auth/useAuthAction';
import { useEnterApp } from '@/auth/useEnterApp';
import { AuthLink } from '@/components/AuthLink';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ErrorNotice } from '@/components/ErrorNotice';
import { FormField } from '@/components/FormField';
import { FORM_ICON_PATHS, FORM_ICON_VIEWBOX } from '@/components/icons/formIcons';
import { LineIcon } from '@/components/icons/LineIcon';
import { SubmitButton } from '@/components/SubmitButton';
import { LOGIN_TEXT } from '@/constants/authText';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';

/**
 * La marca de la aplicacion: el latido de su icono, sin la hoja que lo encierra.
 *
 * Toma el color del tema, asi que se apoya en el lienzo en lugar de flotar sobre
 * el. Se oculta a lectores de pantalla: no dice nada que el titular no diga.
 */
function AppMark() {
  const theme = useTheme();

  return (
    <LineIcon
      path={FORM_ICON_PATHS.mark}
      color={theme.bloom}
      viewBox={FORM_ICON_VIEWBOX}
      side={MARK_SIDE}
    />
  );
}

/** Lado de la marca. Bastante para reconocerla, poco para no competir con el titular. */
const MARK_SIDE = 48;

/**
 * Pantalla de acceso.
 *
 * LLEVA LA MARCA Y LAS DEMAS NO. Es la primera pantalla que ve alguien que ya
 * tiene cuenta, o sea la unica donde decir de quien es la aplicacion informa de
 * algo. Repetirla en registro, recuperacion y verificacion seria firmar cuatro
 * veces la misma carta.
 *
 * @returns La pantalla de acceso.
 */
export function LoginScreen() {
  const router = useRouter();
  const enterApp = useEnterApp();
  const { isBusy, failureReason, run } = useAuthAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => run(() => authService.signIn({ email, password }), enterApp);

  return (
    <AuthScreenLayout
      title={LOGIN_TEXT.title}
      mark={<AppMark />}
      footer={<SubmitButton label={LOGIN_TEXT.submit} onPress={submit} isBusy={isBusy} />}
    >
      <ErrorNotice reason={failureReason} />
      <FormField kind="email" label={LOGIN_TEXT.email} value={email} onChangeText={setEmail} />
      <FormField
        kind="password"
        label={LOGIN_TEXT.password}
        value={password}
        onChangeText={setPassword}
      />
      <View style={styles.linksRow}>
        <AuthLink label={LOGIN_TEXT.forgot} onPress={() => router.push('/recover')} />
        <AuthLink label={LOGIN_TEXT.toRegister} onPress={() => router.push('/register')} />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  linksRow: {
    gap: gap.xs,
    paddingTop: gap.xs,
    alignItems: 'center',
  },
});
