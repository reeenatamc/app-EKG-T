import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { MOUNTS, type MountId } from '@/camera/mounts';
import { MOUNT_COPY } from '@/constants/captureText';
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
      {MOUNTS.map((mount) => {
        const copy = MOUNT_COPY[mount.id];
        const isActive = mount.id === value;

        return (
          <Pressable
            key={mount.id}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${copy.label}. ${copy.hint}`}
            onPress={() => onChange(mount.id)}
            style={[styles.chip, isActive ? styles.chipActive : null]}
          >
            <Text style={[type.caption, { color: isActive ? paperLight.ink : paperDark.textHigh }]}>
              {copy.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
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
