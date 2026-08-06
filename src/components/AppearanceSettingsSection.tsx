import { SegmentedControl, type SegmentedOption } from '@/components/SegmentedControl';
import { SettingsRow } from '@/components/SettingsRow';
import { SettingsSection } from '@/components/SettingsSection';
import { SETTINGS_TEXT } from '@/constants/shellText';
import { useSettings, type ThemeMode } from '@/state/settings';

const THEME_OPTIONS: readonly SegmentedOption<ThemeMode | null>[] = [
  { value: null, label: SETTINGS_TEXT.themeSystem },
  { value: 'light', label: SETTINGS_TEXT.themeLight },
  { value: 'dark', label: SETTINGS_TEXT.themeDark },
];

/**
 * Bloque de apariencia de los ajustes.
 *
 * "Sistema" es el valor por defecto y sigue a useColorScheme. Elegir claro u
 * oscuro fija la preferencia y sobrevive al cierre de la aplicacion.
 *
 * @returns El bloque de apariencia.
 */
export function AppearanceSettingsSection() {
  const mode = useSettings((state) => state.mode);
  const setMode = useSettings((state) => state.setMode);

  return (
    <SettingsSection title={SETTINGS_TEXT.appearanceSection}>
      <SettingsRow label={SETTINGS_TEXT.themeLabel}>
        <SegmentedControl
          options={THEME_OPTIONS}
          value={mode}
          onChange={setMode}
          accessibilityLabel={SETTINGS_TEXT.themeLabel}
        />
      </SettingsRow>
    </SettingsSection>
  );
}
