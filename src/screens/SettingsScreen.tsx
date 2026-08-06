import { useRouter } from 'expo-router';

import { useSession } from '@/auth/session';
import { AccessibilitySettingsSection } from '@/components/AccessibilitySettingsSection';
import { ActionButton } from '@/components/ActionButton';
import { AppearanceSettingsSection } from '@/components/AppearanceSettingsSection';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ClinicalSettingsSection } from '@/components/ClinicalSettingsSection';
import { SettingsSection } from '@/components/SettingsSection';
import { SETTINGS_TEXT } from '@/constants/shellText';

/**
 * Pantalla de ajustes.
 *
 * Todo lo que hay aqui persiste entre arranques y ramifica comportamiento real:
 * ningun interruptor es decorativo. La unica fila que no cambia nada es la de
 * idioma, y es informativa a proposito.
 *
 * VA SOBRE LIENZO PLANO aunque comparta composicion con las pantallas de acceso:
 * se llega desde Perfil, o sea que esta dentro del producto y no en la entrada
 * (D-20).
 *
 * @returns La pantalla de ajustes.
 */
export function SettingsScreen() {
  const router = useRouter();
  const closeSession = useSession((state) => state.close);

  const signOut = () => {
    void closeSession().then(() => router.replace('/login'));
  };

  return (
    <AuthScreenLayout title={SETTINGS_TEXT.title} atmosphere={false}>
      <AppearanceSettingsSection />
      <AccessibilitySettingsSection />
      <ClinicalSettingsSection />

      <SettingsSection title={SETTINGS_TEXT.accountSection}>
        <ActionButton label={SETTINGS_TEXT.signOut} onPress={signOut} variant="secondary" />
      </SettingsSection>
    </AuthScreenLayout>
  );
}
