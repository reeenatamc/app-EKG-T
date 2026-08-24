import { SettingsSection } from '@/components/SettingsSection';
import { SETTINGS_TEXT } from '@/constants/shellText';
import { SettingsToggleRow } from '@/design/SettingsToggleRow';
import { useSettings } from '@/state/settings';

/**
 * Bloque de accesibilidad de los ajustes.
 *
 * Los tres interruptores ramifican comportamiento real, no son declarativos.
 * El de transparencia es ademas la **unica** via en Android para caer a
 * superficies opacas: alli isReduceTransparencyEnabled() devuelve siempre
 * false, asi que sin este control esa rama seria inalcanzable.
 *
 * El de vibracion no es un ajuste de accesibilidad en el sentido clasico, pero
 * vive aqui por el mismo motivo que los otros dos: apaga una capa sensorial
 * entera. Y hace falta poder apagarla porque depende de donde se usa la
 * aplicacion, no de quien la usa: una sala con el paciente dormido.
 *
 * @returns El bloque de accesibilidad.
 */
export function AccessibilitySettingsSection() {
  const settings = useSettings();

  return (
    <SettingsSection title={SETTINGS_TEXT.accessibilitySection}>
      <SettingsToggleRow
        label={SETTINGS_TEXT.reduceTransparency}
        hint={SETTINGS_TEXT.reduceTransparencyHint}
        value={settings.reduceTransparency}
        onValueChange={settings.setReduceTransparency}
      />
      <SettingsToggleRow
        label={SETTINGS_TEXT.reduceMotion}
        hint={SETTINGS_TEXT.reduceMotionHint}
        value={settings.reduceMotion}
        onValueChange={settings.setReduceMotion}
      />
      <SettingsToggleRow
        label={SETTINGS_TEXT.haptics}
        hint={SETTINGS_TEXT.hapticsHint}
        value={settings.haptics}
        onValueChange={settings.setHaptics}
      />
    </SettingsSection>
  );
}
