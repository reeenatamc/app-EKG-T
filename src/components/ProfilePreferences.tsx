import { THEME_OPTIONS } from '@/components/AppearanceSettingsSection';
import { ELECTRODE_OPTIONS } from '@/components/ClinicalSettingsSection';
import { GroupedControlRow, GroupedList, GroupedToggleRow } from '@/components/GroupedList';
import { SegmentedControl } from '@/components/SegmentedControl';
import { SettingsSection } from '@/components/SettingsSection';
import { PROFILE_TEXT, SETTINGS_TEXT } from '@/constants/shellText';
import { useSettings } from '@/state/settings';

/**
 * Las preferencias que se tocan a menudo, sin entrar en Ajustes.
 *
 * QUE ENTRA Y QUE NO. Tema, estandar de electrodos y vibracion: los tres dependen
 * de donde y como se trabaja —una guardia de noche, un hospital con codigo IEC,
 * una sala con el paciente dormido— y se cambian por eso. Los ajustes de
 * accesibilidad y el idioma se eligen una vez y se quedan en Ajustes.
 *
 * Son los mismos ajustes y las mismas opciones que en Ajustes, leidas del mismo
 * almacen: cambiar uno aqui lo cambia alli.
 *
 * @returns El bloque de preferencias.
 */
export function ProfilePreferences() {
  const settings = useSettings();

  return (
    <SettingsSection title={PROFILE_TEXT.preferencesSection}>
      <GroupedList>
        <GroupedControlRow label={SETTINGS_TEXT.themeLabel}>
          <SegmentedControl
            options={THEME_OPTIONS}
            value={settings.mode}
            onChange={settings.setMode}
            accessibilityLabel={SETTINGS_TEXT.themeLabel}
          />
        </GroupedControlRow>
        <GroupedControlRow label={SETTINGS_TEXT.electrodeLabel} hint={SETTINGS_TEXT.electrodeHint}>
          <SegmentedControl
            options={ELECTRODE_OPTIONS}
            value={settings.electrodeStandard}
            onChange={settings.setElectrodeStandard}
            accessibilityLabel={SETTINGS_TEXT.electrodeLabel}
          />
        </GroupedControlRow>
        <GroupedToggleRow
          label={SETTINGS_TEXT.haptics}
          value={settings.haptics}
          onValueChange={settings.setHaptics}
        />
      </GroupedList>
    </SettingsSection>
  );
}
