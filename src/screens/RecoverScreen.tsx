import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { mockAuthService } from '@/auth/MockAuthService';
import { useAuthAction } from '@/auth/useAuthAction';
import { AuthLink } from '@/components/AuthLink';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ErrorNotice } from '@/components/ErrorNotice';
import { FormField } from '@/components/FormField';
import { SubmitButton } from '@/components/SubmitButton';
import { RECOVERY_TEXT } from '@/constants/authText';
import { useTheme } from '@/design/theme';
import { type } from '@/design/type';

/**
 * Pantalla de recuperacion de acceso.
 *
 * @returns La pantalla de recuperacion.
 */
export function RecoverScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isBusy, failureReason, run } = useAuthAction();
  const [email, setEmail] = useState('');

  const submit = () =>
    run(
      () => mockAuthService.requestPasswordReset(email),
      (pending) => router.push({ pathname: '/verify', params: { email: pending.email } }),
    );

  return (
    <AuthScreenLayout
      title={RECOVERY_TEXT.title}
      footer={<SubmitButton label={RECOVERY_TEXT.submit} onPress={submit} isBusy={isBusy} />}
    >
      <Text style={[type.body, { color: theme.textLow }]}>{RECOVERY_TEXT.body}</Text>
      <ErrorNotice reason={failureReason} />
      <FormField kind="email" label={RECOVERY_TEXT.email} value={email} onChangeText={setEmail} />
      <AuthLink label={RECOVERY_TEXT.toLogin} onPress={() => router.replace('/login')} />
    </AuthScreenLayout>
  );
}
