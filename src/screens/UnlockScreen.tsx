import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Text } from 'react-native';

import { useBiometricUnlock } from '@/auth/useBiometricUnlock';
import { usePasswordFallback } from '@/auth/usePasswordFallback';
import { ActionButton } from '@/components/ActionButton';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { UNLOCK_TEXT } from '@/constants/authText';
import { useTheme } from '@/design/theme';
import { type } from '@/design/type';

/**
 * Pantalla de desbloqueo biometrico.
 *
 * Siempre ofrece salida por contrasena. Un sensor sucio, un dedo mojado o una
 * mano con guante no pueden dejar a nadie fuera de su propia cuenta, y esta es
 * una aplicacion que se usa con prisa.
 *
 * @returns La pantalla de desbloqueo.
 */
export function UnlockScreen() {
  const router = useRouter();
  const theme = useTheme();
  const enter = useCallback(() => router.replace('/home'), [router]);
  const { hasFailed, attempt } = useBiometricUnlock(enter);
  const fallBackToPassword = usePasswordFallback();

  return (
    <AuthScreenLayout
      title={UNLOCK_TEXT.title}
      footer={
        <>
          <ActionButton label={UNLOCK_TEXT.unlock} onPress={attempt} variant="primary" />
          <ActionButton
            label={UNLOCK_TEXT.usePassword}
            onPress={fallBackToPassword}
            variant="secondary"
          />
        </>
      }
    >
      <Text style={[type.body, { color: theme.textLow }]}>{UNLOCK_TEXT.body}</Text>
      {hasFailed ? (
        <Text style={[type.body, { color: theme.textHigh }]}>
          {UNLOCK_TEXT.failed}. {UNLOCK_TEXT.failedAction}
        </Text>
      ) : null}
    </AuthScreenLayout>
  );
}
