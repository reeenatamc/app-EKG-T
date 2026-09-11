import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSession } from '@/auth/session';
import { formatStudyDate } from '@/capture/studyDate';
import { useQueueHydrated, useUploadQueue } from '@/capture/uploadQueue';
import { AppTabBar } from '@/components/AppTabBar';
import { GroupedInfoRow, GroupedLinkRow, GroupedList } from '@/components/GroupedList';
import { Notice } from '@/components/Notice';
import { ProfileIdentity } from '@/components/ProfileIdentity';
import { ProfilePreferences } from '@/components/ProfilePreferences';
import { ScreenHeader } from '@/components/ScreenHeader';
import { SettingsSection } from '@/components/SettingsSection';
import { PROFILE_TEXT, SETTINGS_TEXT } from '@/constants/shellText';
import { getAppEnvironment } from '@/config/env';
import { Background } from '@/design/Background';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';
import { useSignOut } from '@/shell/useSignOut';

const TAB_BAR_CLEARANCE = 96;

/**
 * Perfil de la cuenta.
 *
 * ERA UNA FICHA DE DOS DATOS: correo, rol y un boton a Ajustes. Para ver o cambiar
 * cualquier otra cosa habia que entrar en Ajustes, y el perfil no contaba nada que
 * no se supiera ya. Ahora es la ficha de trabajo de quien usa la aplicacion:
 *
 * - quien es la cuenta, con su rol, que decide lo que ensena el resto;
 * - que guarda este telefono, y que pasa con ello al cerrar sesion;
 * - las preferencias que se cambian segun el turno, sin entrar en Ajustes;
 * - la salida: los ajustes que quedan y cerrar sesion.
 *
 * Al pie, la version: es lo primero que se pregunta cuando algo falla.
 *
 * @returns La pantalla de perfil.
 */
export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const session = useSession((state) => state.session);

  return (
    <Background atmosphere={false} chrome={<AppTabBar />}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + gap.xl, paddingBottom: insets.bottom + TAB_BAR_CLEARANCE },
        ]}
      >
        <ScreenHeader title={PROFILE_TEXT.title} size="headline" />
        <ProfileIdentity session={session} />
        <ProfileActivity />
        <ProfilePreferences />
        <ProfileAccount />
        <AppVersion />
      </ScrollView>
    </Background>
  );
}

/**
 * Que hay guardado en este telefono.
 *
 * Mientras se lee el disco los valores van vacios y no a cero: un «0 estudios» en
 * los primeros fotogramas mentiria a quien tiene cuatro.
 */
function ProfileActivity() {
  const theme = useTheme();
  const hasHydrated = useQueueHydrated();
  const studies = useUploadQueue((state) => state.studies);
  const last = studies[studies.length - 1];

  const lastValue =
    last === undefined ? PROFILE_TEXT.lastStudyNone : formatStudyDate(last.metadata.capturedAt);

  return (
    <SettingsSection title={PROFILE_TEXT.activitySection}>
      <GroupedList>
        <GroupedInfoRow
          label={PROFILE_TEXT.studiesLabel}
          value={hasHydrated ? String(studies.length) : ''}
          isFigure
        />
        <GroupedInfoRow
          label={PROFILE_TEXT.lastStudyLabel}
          value={hasHydrated ? lastValue : ''}
          isFigure={last !== undefined}
        />
      </GroupedList>
      <Text style={[type.caption, { color: theme.textLow }]}>{PROFILE_TEXT.activityNote}</Text>
    </SettingsSection>
  );
}

/** Los ajustes que no estan aqui, y cerrar sesion con su aviso si hay algo a medias. */
function ProfileAccount() {
  const router = useRouter();
  const { hasPending, signOut } = useSignOut();

  return (
    <SettingsSection title={PROFILE_TEXT.accountSection}>
      {hasPending ? (
        <Notice
          title={SETTINGS_TEXT.pendingOnSignOut.title}
          action={SETTINGS_TEXT.pendingOnSignOut.action}
        />
      ) : null}
      <GroupedList>
        <GroupedLinkRow
          label={PROFILE_TEXT.settingsAction}
          hint={PROFILE_TEXT.settingsHint}
          onPress={() => router.push('/settings')}
        />
        <GroupedLinkRow label={PROFILE_TEXT.signOut} onPress={signOut} leadsSomewhere={false} />
      </GroupedList>
    </SettingsSection>
  );
}

/** Nombre y version de la aplicacion, al pie. */
function AppVersion() {
  const theme = useTheme();
  const { name, version } = getAppEnvironment();

  return (
    <Text style={[type.caption, styles.centered, { color: theme.textLow }]}>
      {name} · {PROFILE_TEXT.version} {version}
    </Text>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: gap.lg, gap: gap.xl },
  centered: { textAlign: 'center' },
});
