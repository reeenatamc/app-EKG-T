import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text } from 'react-native';

import { mockAuthService } from '@/auth/MockAuthService';
import { useAuthAction } from '@/auth/useAuthAction';
import { useEnterApp } from '@/auth/useEnterApp';
import { AuthLink } from '@/components/AuthLink';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ErrorNotice } from '@/components/ErrorNotice';
import { FormField } from '@/components/FormField';
import { SubmitButton } from '@/components/SubmitButton';
import { VERIFY_TEXT } from '@/constants/authText';
import { useTheme } from '@/design/theme';
import { type } from '@/design/type';

/**
 * Pantalla de verificacion por codigo.
 *
 * El correo llega como parametro de ruta en lugar de guardarse en estado
 * global: es un dato de un solo uso que muere con el flujo, y meterlo en un
 * store obligaria a acordarse de limpiarlo.
 *
 * @returns La pantalla de verificacion.
 */
export function VerifyScreen() {
  const theme = useTheme();
  const { email } = useLocalSearchParams<{ email: string }>();
  const enterApp = useEnterApp();
  const { isBusy, failureReason, run } = useAuthAction();
  const [code, setCode] = useState('');

  const submit = () => run(() => mockAuthService.verifyCode({ email, code }), enterApp);

  // Pide un codigo nuevo de verdad. Un enlace que dice "enviar otro codigo" y
  // solo limpia el campo es interfaz que miente.
  const resend = () =>
    run(
      () => mockAuthService.requestPasswordReset(email),
      () => setCode(''),
    );

  return (
    <AuthScreenLayout
      title={VERIFY_TEXT.title}
      footer={<SubmitButton label={VERIFY_TEXT.submit} onPress={submit} isBusy={isBusy} />}
    >
      <Text style={[type.body, { color: theme.textLow }]}>
        {VERIFY_TEXT.bodyPrefix}{' '}
        {/* El correo es un identificador, no prosa: va en monoespaciada (§6). */}
        <Text style={type.data}>{email}</Text>
      </Text>
      <ErrorNotice reason={failureReason} />
      <FormField kind="code" label={VERIFY_TEXT.code} value={code} onChangeText={setCode} />
      <AuthLink label={VERIFY_TEXT.resend} onPress={resend} disabled={isBusy} />
    </AuthScreenLayout>
  );
}
