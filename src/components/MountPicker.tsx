import { Pressable, StyleSheet, Text, View } from 'react-native';

import { MOUNTS, type MountId } from '@/camera/mounts';
import { MOUNT_COPY } from '@/constants/captureText';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface MountPickerProps {
  readonly value: MountId;
  readonly onChange: (mount: MountId) => void;
}

/**
 * Eleccion del montaje, en lista y con una linea de apoyo por opcion.
 *
 * En lista y no en control segmentado porque son cinco opciones con nombres
 * largos: metidas en una fila quedarian ilegibles, y este es precisamente el
 * dato que no conviene equivocar. Un 3x3 de derivaciones derechas leido como un
 * 3x4 estandar no da un error visible, da doce derivaciones mal etiquetadas.
 *
 * @param value Montaje seleccionado.
 * @param onChange Se invoca con el montaje elegido.
 * @returns La lista de montajes.
 */
export function MountPicker({ value, onChange }: MountPickerProps) {
  const theme = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={styles.list}>
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
            style={[
              styles.option,
              { backgroundColor: theme.surface },
              // Tinta y no carmin: seleccionar es estado, y §12.9 reserva el
              // carmin para superficies grandes.
              isActive ? { borderColor: theme.textHigh } : null,
            ]}
          >
            <Text style={[type.body, { color: theme.textHigh }]}>{copy.label}</Text>
            <Text style={[type.caption, { color: theme.textLow }]}>{copy.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: gap.sm },
  option: {
    minHeight: size.touchTarget,
    paddingVertical: gap.md,
    paddingHorizontal: gap.lg,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    borderWidth: size.frameBorder,
    // Borde transparente en reposo para que seleccionar no cambie la altura de
    // la fila y la lista no salte al elegir.
    borderColor: 'transparent',
    gap: gap.xs,
  },
});
