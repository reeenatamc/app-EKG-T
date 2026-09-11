import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { authService } from '@/auth/service';
import { useAuthAction } from '@/auth/useAuthAction';
import { AuthLink } from '@/components/AuthLink';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ErrorNotice } from '@/components/ErrorNotice';
import { FormField } from '@/components/FormField';
import { SubmitButton } from '@/components/SubmitButton';
import { RECOVERY_TEXT } from '@/constants/authText';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

export function RecoverScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { isBusy, failureReason, run } = useAuthAction();
  const [email, setEmail] = useState('');

  const submit = () =>
    run(
      () => authService.requestPasswordReset(email),
      (pending) => router.push({ pathname: '/verify', params: { email: pending.email } }),
    );

  return (
    <AuthScreenLayout
      title={RECOVERY_TEXT.title}
      footer={<SubmitButton label={RECOVERY_TEXT.submit} onPress={submit} isBusy={isBusy} />}
    >
      <Text style={[type.body, styles.bodyText, { color: theme.textLow }]}>
        {RECOVERY_TEXT.body}
      </Text>
      <ErrorNotice reason={failureReason} />
      <FormField kind="email" label={RECOVERY_TEXT.email} value={email} onChangeText={setEmail} />
      <View style={styles.linksRow}>
        <AuthLink label={RECOVERY_TEXT.toLogin} onPress={() => router.replace('/login')} />
      </View>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  bodyText: {
    lineHeight: 22,
    textAlign: 'center',
  },
  linksRow: {
    alignItems: 'center',
    paddingTop: gap.xs,
  },
});
