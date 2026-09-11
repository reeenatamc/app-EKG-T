import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { authService } from '@/auth/service';
import { useAuthAction } from '@/auth/useAuthAction';
import { useEnterApp } from '@/auth/useEnterApp';
import { AuthLink } from '@/components/AuthLink';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ErrorNotice } from '@/components/ErrorNotice';
import { FormField } from '@/components/FormField';
import { SubmitButton } from '@/components/SubmitButton';
import { VERIFY_TEXT } from '@/constants/authText';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

export function VerifyScreen() {
  const { email } = useLocalSearchParams<{ email: string }>();
  const enterApp = useEnterApp();
  const { isBusy, failureReason, run } = useAuthAction();
  const [code, setCode] = useState('');

  const submit = () => run(() => authService.verifyCode({ email, code }), enterApp);

  const resend = () =>
    run(
      () => authService.requestPasswordReset(email),
      () => setCode(''),
    );

  return (
    <AuthScreenLayout
      title={VERIFY_TEXT.title}
      footer={<SubmitButton label={VERIFY_TEXT.submit} onPress={submit} isBusy={isBusy} />}
    >
      <EmailRecipient email={email ?? ''} />
      <ErrorNotice reason={failureReason} />
      <FormField kind="code" label={VERIFY_TEXT.code} value={code} onChangeText={setCode} />
      <View style={styles.linksRow}>
        <AuthLink label={VERIFY_TEXT.resend} onPress={resend} disabled={isBusy} />
      </View>
    </AuthScreenLayout>
  );
}

/**
 * A que correo fue el codigo.
 *
 * Texto suelto, sin capsula. Es un dato de una linea y media; rodearlo de un
 * borde redondeado no lo hace mas legible, solo anade una forma mas a una
 * pantalla cuyo trabajo entero son seis cifras.
 */
function EmailRecipient({ email }: { readonly email: string }) {
  const theme = useTheme();

  return (
    <View style={styles.recipient}>
      <Text style={[type.caption, { color: theme.textLow }]}>{VERIFY_TEXT.bodyPrefix}</Text>
      <Text style={[type.data, styles.emailText, { color: theme.textHigh }]}>{email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  recipient: { alignItems: 'center', gap: 2 },
  emailText: {
    fontSize: 13,
    fontWeight: '600',
  },
  linksRow: {
    alignItems: 'center',
    paddingTop: gap.xs,
  },
});
