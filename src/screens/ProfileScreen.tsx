import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { ActionButton } from '@/components/ActionButton';
import { AppTabBar } from '@/components/AppTabBar';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsRow } from '@/components/SettingsRow';
import { PROFILE_TEXT } from '@/constants/shellText';
import { Background } from '@/design/Background';
import { gap } from '@/design/tokens';

const TAB_BAR_CLEARANCE = 96;

/**
 * Perfil de la cuenta.
 *
 * Muestra el rol elegido en el registro porque condiciona lo que el usuario ve
 * en el resto de la aplicacion, y esconderlo dejaria sin explicacion las
 * diferencias que note.
 *
 * AHORA TIENE TITULAR. `PROFILE_TEXT.title` estaba definido y no se renderizaba
 * en ningun sitio: la pantalla empezaba directamente en una fila de ajuste. Se
 * veia en la lamina de D.1.
 *
 * @returns La pantalla de perfil.
 */
export function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const session = useSession((state) => state.session);

  const roleLabel =
    session?.role === 'student' ? PROFILE_TEXT.roleStudent : PROFILE_TEXT.roleProfessional;

  return (
    <Background atmosphere={false} chrome={<AppTabBar />}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + gap.xl, paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
        ]}
      >
        <ScreenHeader title={PROFILE_TEXT.title} />
        <SettingsRow
          label={PROFILE_TEXT.emailLabel}
          value={session?.email ?? PROFILE_TEXT.emailMissing}
        />
        <SettingsRow label={PROFILE_TEXT.roleLabel} value={roleLabel} />
        <ActionButton
          label={PROFILE_TEXT.settingsAction}
          onPress={() => router.push('/settings')}
          variant="secondary"
        />
      </ScrollView>
    </Background>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gap.lg, gap: gap.md },
});
