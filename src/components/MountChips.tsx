import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { MOUNTS, type MountId } from '@/camera/mounts';
import { MOUNT_COPY } from '@/constants/captureText';
import { playHaptic } from '@/design/haptics';
import { gap, opacity, paperDark, paperLight, radius, scrim, size } from '@/design/tokens';
import { type } from '@/design/type';

interface MountChipsProps {
  readonly value: MountId;
  readonly onChange: (mount: MountId) => void;
}

/**
 * Eleccion del montaje sobre la vista previa de la camara.
 *
 * Aparece aqui, y no solo en la pantalla de confirmacion, porque el montaje se
 * sabe mirando la hoja: es el momento en que el usuario la tiene delante. En la
 * confirmacion vuelve a mostrarse para poder corregirlo con la foto ya hecha.
 *
 * Va con los colores fijos del tema oscuro, como el resto de la capa de
 * captura, y sobre velo solido en lugar de vidrio: es un control, y un control
 * sobre vidrio con imagen viva detras cambia de contraste cada vez que se mueve
 * la camara.
 *
 * @param value Montaje seleccionado.
 * @param onChange Se invoca con el montaje elegido.
 * @returns La fila de montajes.
 */
export function MountChips({ value, onChange }: MountChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      contentContainerStyle={styles.row}
    >
      {MOUNTS.map((mount) => (
        <MountChip
          key={mount.id}
          mount={mount.id}
          isActive={mount.id === value}
          onPress={() => {
            playHaptic('selection');
            onChange(mount.id);
          }}
        />
      ))}
    </ScrollView>
  );
}

interface MountChipProps {
  readonly mount: MountId;
  readonly isActive: boolean;
  readonly onPress: () => void;
}

/**
 * Un montaje de la fila.
 *
 * La etiqueta accesible lleva ademas la linea de apoyo: quien no reconozca el
 * nombre del reparto no puede elegir bien, y en un lector de pantalla el nombre
 * solo no basta.
 *
 * @param mount Montaje que representa.
 * @param isActive Cierto si es el elegido.
 * @param onPress Accion al pulsarlo.
 * @returns El chip renderizado.
 */
function MountChip({ mount, isActive, onPress }: MountChipProps) {
  const copy = MOUNT_COPY[mount];

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${copy.label}. ${copy.hint}`}
      onPress={onPress}
      style={[styles.chip, isActive ? styles.chipActive : null]}
    >
      <Text style={[type.caption, { color: isActive ? paperLight.ink : paperDark.textHigh }]}>
        {copy.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { gap: gap.sm, paddingHorizontal: gap.lg },
  chip: {
    minHeight: size.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: gap.lg,
    borderRadius: radius.pill,
    backgroundColor: scrim.strong,
    borderWidth: size.hairline,
    borderColor: paperDark.textLow,
    opacity: opacity.pressed,
  },
  chipActive: {
    backgroundColor: paperDark.textHigh,
    borderColor: paperDark.textHigh,
    opacity: 1,
  },
});
