import { AccessibilitySettingsSection } from '@/components/AccessibilitySettingsSection';
import { ActionButton } from '@/components/ActionButton';
import { AppearanceSettingsSection } from '@/components/AppearanceSettingsSection';
import { AuthScreenLayout } from '@/components/AuthScreenLayout';
import { ClinicalSettingsSection } from '@/components/ClinicalSettingsSection';
import { Notice } from '@/components/Notice';
import { SettingsSection } from '@/components/SettingsSection';
import { SETTINGS_TEXT } from '@/constants/shellText';
import { useGoBack } from '@/shell/useGoBack';
import { useSignOut } from '@/shell/useSignOut';

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
 * Cerrar sesion se decide en `useSignOut`, que comparte con Perfil: pregunta antes,
 * y avisa si hay estudios a medias.
 *
 * @returns La pantalla de ajustes.
 */
export function SettingsScreen() {
  const { hasPending, signOut } = useSignOut();
  const goBack = useGoBack('/profile');

  return (
    <AuthScreenLayout title={SETTINGS_TEXT.title} atmosphere={false} onBack={goBack}>
      <AppearanceSettingsSection />
      <AccessibilitySettingsSection />
      <ClinicalSettingsSection />

      <SettingsSection title={SETTINGS_TEXT.accountSection}>
        {hasPending ? (
          <Notice
            title={SETTINGS_TEXT.pendingOnSignOut.title}
            action={SETTINGS_TEXT.pendingOnSignOut.action}
          />
        ) : null}
        <ActionButton label={SETTINGS_TEXT.signOut} onPress={signOut} variant="secondary" />
      </SettingsSection>
    </AuthScreenLayout>
  );
}
