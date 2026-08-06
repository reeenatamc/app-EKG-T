import { useRouter } from 'expo-router';
import { useState } from 'react';

import type { UserRole } from '@/auth/AuthService';
import { mockAuthService } from '@/auth/MockAuthService';
import { useAuthAction } from '@/auth/useAuthAction';
import { AuthLink } from '@/components/AuthLink';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ErrorNotice } from '@/components/ErrorNotice';
import { FormField } from '@/components/FormField';
import { RoleSelector } from '@/components/RoleSelector';
import { SubmitButton } from '@/components/SubmitButton';
import { REGISTER_TEXT } from '@/constants/authText';

/**
 * Pantalla de registro.
 *
 * El rol se elige aqui y no en ajustes porque condiciona lo que el usuario vera
 * despues; enterrarlo en una pantalla secundaria lo convertiria en una decision
 * accidental.
 *
 * @returns La pantalla de registro.
 */
export function RegisterScreen() {
  const router = useRouter();
  const { isBusy, failureReason, run } = useAuthAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('professional');

  const submit = () =>
    run(
      () => mockAuthService.register({ email, password, role }),
      (pending) => router.push({ pathname: '/verify', params: { email: pending.email } }),
    );

  return (
    <AuthScreenLayout
      title={REGISTER_TEXT.title}
      footer={<SubmitButton label={REGISTER_TEXT.submit} onPress={submit} isBusy={isBusy} />}
    >
      <ErrorNotice reason={failureReason} />
      <FormField kind="email" label={REGISTER_TEXT.email} value={email} onChangeText={setEmail} />
      <FormField
        kind="newPassword"
        label={REGISTER_TEXT.password}
        value={password}
        onChangeText={setPassword}
        hint={REGISTER_TEXT.passwordHint}
      />
      <RoleSelector value={role} onChange={setRole} />
      <AuthLink label={REGISTER_TEXT.toLogin} onPress={() => router.replace('/login')} />
    </AuthScreenLayout>
  );
}
