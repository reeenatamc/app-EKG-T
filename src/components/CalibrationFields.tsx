import { StyleSheet, Text, View } from 'react-native';

import { CALIBRATION_GAINS, CALIBRATION_SPEEDS, type Calibration } from '@/capture/study';
import { SegmentedControl } from '@/components/SegmentedControl';
import { CONFIRM_TEXT } from '@/constants/captureText';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

interface CalibrationFieldsProps {
  readonly value: Calibration;
  readonly onChange: (calibration: Calibration) => void;
}

/**
 * Velocidad del papel y amplitud con que se imprimio el registro.
 *
 * Son la escala de los dos ejes: sin ellas la digitalizacion no puede pasar de
 * milimetros a segundos y milivoltios. Vienen con los valores estandar puestos
 * porque son los habituales, pero se editan porque no son universales: media
 * velocidad para caber diez segundos en menos papel, media amplitud cuando el
 * complejo satura y se solapa con la fila de arriba.
 *
 * @param value Calibracion actual.
 * @param onChange Se invoca con la calibracion modificada.
 * @returns Los dos selectores de calibracion.
 */
export function CalibrationFields({ value, onChange }: CalibrationFieldsProps) {
  return (
    <View style={styles.fields}>
      <CalibrationField
        label={CONFIRM_TEXT.speedLabel}
        unit="mm/s"
        options={CALIBRATION_SPEEDS}
        value={value.speedMmPerSecond}
        onChange={(speed) => onChange({ ...value, speedMmPerSecond: speed })}
      />
      <CalibrationField
        label={CONFIRM_TEXT.gainLabel}
        unit="mm/mV"
        options={CALIBRATION_GAINS}
        value={value.gainMmPerMillivolt}
        onChange={(gain) => onChange({ ...value, gainMmPerMillivolt: gain })}
      />
    </View>
  );
}

interface CalibrationFieldProps {
  readonly label: string;
  readonly unit: string;
  readonly options: readonly number[];
  readonly value: number;
  readonly onChange: (value: number) => void;
}

/**
 * Un parametro de calibracion con su unidad a la vista.
 *
 * La unidad va en cada opcion y no solo en la etiqueta: un selector que dijese
 * "12,5 / 25 / 50" obligaria a mirar arriba para saber de que se esta hablando.
 */
function CalibrationField({ label, unit, options, value, onChange }: CalibrationFieldProps) {
  const theme = useTheme();

  return (
    <View style={styles.field}>
      <Text style={[type.caption, { color: theme.textLow }]}>{label}</Text>
      <SegmentedControl
        accessibilityLabel={label}
        options={options.map((option) => ({
          value: String(option),
          label: `${option} ${unit}`,
        }))}
        value={String(value)}
        onChange={(next) => onChange(Number(next))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fields: { gap: gap.lg },
  field: { gap: gap.sm },
});
