import { PLAYGROUND_TEXT } from '@/constants/text';
import { SegmentedControl, type SegmentedOption } from '@/components/SegmentedControl';
import { SettingsToggleRow } from '@/design/SettingsToggleRow';
import { useSettings, type ThemeMode } from '@/state/settings';

const THEME_OPTIONS: readonly SegmentedOption<ThemeMode | null>[] = [
  { value: null, label: PLAYGROUND_TEXT.modeSystem },
  { value: 'light', label: PLAYGROUND_TEXT.modeLight },
  { value: 'dark', label: PLAYGROUND_TEXT.modeDark },
];

/**
 * Controles del banco de pruebas.
 *
 * Los dos interruptores no son decorativos: alimentan useReducedTransparency y
 * useReducedMotion, que ramifican comportamiento real. Permiten revisar la
 * caida a opaco sin tocar los ajustes del sistema, algo imprescindible en
 * Android, donde la preferencia de transparencia no existe (§0).
 *
 * @returns El bloque de controles.
 */
export function PlaygroundControls() {
  const settings = useSettings();

  return (
    <>
      <SegmentedControl
        options={THEME_OPTIONS}
        value={settings.mode}
        onChange={settings.setMode}
        accessibilityLabel={PLAYGROUND_TEXT.modeLabel}
      />
      <SettingsToggleRow
        label={PLAYGROUND_TEXT.reduceTransparency}
        value={settings.reduceTransparency}
        onValueChange={settings.setReduceTransparency}
      />
      <SettingsToggleRow
        label={PLAYGROUND_TEXT.reduceMotion}
        value={settings.reduceMotion}
        onValueChange={settings.setReduceMotion}
      />
    </>
  );
}
