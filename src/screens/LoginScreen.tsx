import { useRouter } from 'expo-router';
import { useState } from 'react';

import { mockAuthService } from '@/auth/MockAuthService';
import { useAuthAction } from '@/auth/useAuthAction';
import { useEnterApp } from '@/auth/useEnterApp';
import { AuthLink } from '@/components/AuthLink';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ErrorNotice } from '@/components/ErrorNotice';
import { FormField } from '@/components/FormField';
import { SubmitButton } from '@/components/SubmitButton';
import { LOGIN_TEXT } from '@/constants/authText';

/**
 * Pantalla de acceso.
 *
 * @returns La pantalla de acceso.
 */
export function LoginScreen() {
  const router = useRouter();
  const enterApp = useEnterApp();
  const { isBusy, failureReason, run } = useAuthAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => run(() => mockAuthService.signIn({ email, password }), enterApp);

  return (
    <AuthScreenLayout
      title={LOGIN_TEXT.title}
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
      <AuthLink label={LOGIN_TEXT.forgot} onPress={() => router.push('/recover')} />
      <AuthLink label={LOGIN_TEXT.toRegister} onPress={() => router.push('/register')} />
    </AuthScreenLayout>
  );
}
