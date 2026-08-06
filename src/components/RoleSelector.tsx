import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { UserRole } from '@/auth/AuthService';
import { REGISTER_TEXT } from '@/constants/authText';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

interface RoleOption {
  readonly value: UserRole;
  readonly label: string;
  readonly hint: string;
}

const OPTIONS: readonly RoleOption[] = [
  {
    value: 'professional',
    label: REGISTER_TEXT.roleProfessional,
    hint: REGISTER_TEXT.roleProfessionalHint,
  },
  {
    value: 'student',
    label: REGISTER_TEXT.roleStudent,
    hint: REGISTER_TEXT.roleStudentHint,
  },
];

interface RoleSelectorProps {
  readonly value: UserRole;
  readonly onChange: (role: UserRole) => void;
}

/**
 * Eleccion de rol en el registro.
 *
 * Cada opcion explica que implica, en lugar de dejar que el usuario adivine:
 * el rol condiciona lo que vera despues, y una eleccion mal informada es
 * dificil de deshacer.
 *
 * La opcion activa se marca con borde y con la palabra seleccionada expuesta a
 * accesibilidad, no solo con color (§12.3).
 *
 * @param value Rol seleccionado.
 * @param onChange Se invoca con el rol elegido.
 * @returns El selector de rol.
 */
export function RoleSelector({ value, onChange }: RoleSelectorProps) {
  const theme = useTheme();

  return (
    <View style={styles.group}>
      <Text style={[type.caption, { color: theme.textLow }]}>{REGISTER_TEXT.roleLabel}</Text>
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={`${option.label}. ${option.hint}`}
            onPress={() => onChange(option.value)}
            style={[
              styles.option,
              {
                backgroundColor: theme.surface,
                // Tinta y no carmin: seleccionar es estado (§12.9). El grosor no
                // cambia con la seleccion, para que la lista no salte al elegir.
                borderColor: isActive ? theme.textHigh : theme.edge,
              },
            ]}
          >
            <Text style={[type.body, { color: theme.textHigh }]}>{option.label}</Text>
            <Text style={[type.caption, { color: theme.textLow }]}>{option.hint}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: gap.sm },
  option: {
    minHeight: size.touchTarget,
    padding: gap.lg,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    borderWidth: size.frameBorder,
    gap: gap.xs,
  },
});
