import { useRouter } from 'expo-router';

import { useSession } from '@/auth/session';
import { AccessibilitySettingsSection } from '@/components/AccessibilitySettingsSection';
import { ActionButton } from '@/components/ActionButton';
import { AppearanceSettingsSection } from '@/components/AppearanceSettingsSection';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ClinicalSettingsSection } from '@/components/ClinicalSettingsSection';
import { SettingsSection } from '@/components/SettingsSection';
import { SETTINGS_TEXT } from '@/constants/shellText';
import { useGoBack } from '@/shell/useGoBack';

/**
 * Pantalla de ajustes.
 *
 * Todo lo que hay aqui persiste entre arranques y ramifica comportamiento real:
 * ningun interruptor es decorativo. La unica fila que no cambia nada es la de
 * idioma, y es informativa a proposito.
 *
 * VA SOBRE LIENZO PLANO aunque comparta composicion con las pantallas de acceso:
 * se llega desde Perfil, o sea que esta dentro del producto y no en la entrada
 * (D-20). Y por lo mismo lleva salida: esta apilada encima de Perfil, y sin
 * cabecera del router el gesto del sistema era la unica forma de volver.
 *
 * @returns La pantalla de ajustes.
 */
export function SettingsScreen() {
  const router = useRouter();
  const closeSession = useSession((state) => state.close);
  const goBack = useGoBack('/profile');

  const signOut = () => {
    void closeSession().then(() => router.replace('/login'));
  };

  return (
    <AuthScreenLayout title={SETTINGS_TEXT.title} atmosphere={false} onBack={goBack}>
      <AppearanceSettingsSection />
      <AccessibilitySettingsSection />
      <ClinicalSettingsSection />

      <SettingsSection title={SETTINGS_TEXT.accountSection}>
        <ActionButton label={SETTINGS_TEXT.signOut} onPress={signOut} variant="secondary" />
      </SettingsSection>
    </AuthScreenLayout>
  );
}
