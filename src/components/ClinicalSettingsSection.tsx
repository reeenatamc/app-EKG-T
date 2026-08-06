import { SegmentedControl, type SegmentedOption } from '@/components/SegmentedControl';
import { SettingsRow } from '@/components/SettingsRow';
import { SettingsSection } from '@/components/SettingsSection';
import { SETTINGS_TEXT } from '@/constants/shellText';
import { useSettings, type ElectrodeStandard } from '@/state/settings';

const ELECTRODE_OPTIONS: readonly SegmentedOption<ElectrodeStandard>[] = [
  { value: 'AHA', label: 'AHA' },
  { value: 'IEC', label: 'IEC' },
];

/**
 * Bloque clinico de los ajustes.
 *
 * El estandar de electrodos lo elige el usuario porque los dos codigos de color
 * son incompatibles: en AHA el brazo derecho es blanco y en IEC es rojo. Asumir
 * uno seria asumir el pais.
 *
 * El idioma es una fila **informativa**, no un selector. La aplicacion esta en
 * un solo idioma y un selector con una sola opcion es decoracion, que la
 * especificacion prohibe. El motivo por el que la internacionalizacion queda
 * fuera del alcance esta en src/design/README.md.
 *
 * @returns El bloque clinico.
 */
export function ClinicalSettingsSection() {
  const electrodeStandard = useSettings((state) => state.electrodeStandard);
  const setElectrodeStandard = useSettings((state) => state.setElectrodeStandard);

  return (
    <SettingsSection title={SETTINGS_TEXT.clinicalSection}>
      <SettingsRow label={SETTINGS_TEXT.electrodeLabel} hint={SETTINGS_TEXT.electrodeHint}>
        <SegmentedControl
          options={ELECTRODE_OPTIONS}
          value={electrodeStandard}
          onChange={setElectrodeStandard}
          accessibilityLabel={SETTINGS_TEXT.electrodeLabel}
        />
      </SettingsRow>
      <SettingsRow
        label={SETTINGS_TEXT.languageLabel}
        value={SETTINGS_TEXT.languageValue}
        hint={SETTINGS_TEXT.languageNote}
      />
    </SettingsSection>
  );
}
