import { StyleSheet, Text, View } from 'react-native';

import type { UserRole } from '@/auth/AuthService';
import {
  FORM_ICON_PATHS,
  FORM_ICON_VIEWBOX,
  type FormIconName,
} from '@/components/icons/formIcons';
import { LineIcon } from '@/components/icons/LineIcon';
import { REGISTER_TEXT } from '@/constants/authText';
import { useTheme, type Theme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';
import { AnimatedPressable, usePressMotion } from '@/design/usePressMotion';

interface RoleOption {
  readonly value: UserRole;
  readonly icon: FormIconName;
  readonly label: string;
  /** Lo que cabe en el cuadro. */
  readonly short: string;
  /** Lo que se lee en voz alta, que es la version completa. */
  readonly hint: string;
}

const OPTIONS: readonly RoleOption[] = [
  {
    value: 'professional',
    icon: 'stethoscope',
    label: REGISTER_TEXT.roleProfessional,
    short: REGISTER_TEXT.roleProfessionalShort,
    hint: REGISTER_TEXT.roleProfessionalHint,
  },
  {
    value: 'student',
    icon: 'graduate',
    label: REGISTER_TEXT.roleStudent,
    short: REGISTER_TEXT.roleStudentShort,
    hint: REGISTER_TEXT.roleStudentHint,
  },
];

/** Lado del icono de la opcion. Es lo primero que se mira, asi que manda el. */
const ROLE_ICON_SIDE = 32;

interface RoleSelectorProps {
  readonly value: UserRole;
  readonly onChange: (role: UserRole) => void;
}

/**
 * Eleccion de rol en el registro.
 *
 * DOS CUADROS, UNO AL LADO DEL OTRO, cada uno con su icono. Antes eran dos filas
 * apiladas a ancho completo, solo con texto: para compararlas habia que leerlas,
 * y dos bloques de prosa uno encima de otro se leen como una lista de terminos y
 * condiciones, no como una eleccion. Enfrentadas y con un fonendoscopio y un
 * birrete encima, la eleccion se ve antes de leerse.
 *
 * EL TEXTO LARGO NO SE PIERDE: sigue siendo la etiqueta de accesibilidad. En el
 * cuadro cabe un resumen, pero quien navega a ciegas necesita saber que implica
 * elegir, y esa informacion no puede depender de cuanto espacio hay.
 *
 * La opcion activa se marca con borde de tinta y con el estado expuesto a
 * accesibilidad, nunca solo con color (§12.3). El grosor del borde no cambia al
 * seleccionar, para que la fila no salte.
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
      <View style={styles.row}>
        {OPTIONS.map((option) => (
          <RoleTile
            key={option.value}
            option={option}
            isActive={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

interface RoleTileProps {
  readonly option: RoleOption;
  readonly isActive: boolean;
  readonly onPress: () => void;
}

/**
 * Superficie y filo del cuadro segun este elegido.
 *
 * Tinta y no carmin: seleccionar es estado, no marca (§12.9). Y el grosor no
 * cambia, para que la fila no salte al elegir.
 */
function tileColors(theme: Theme, isActive: boolean) {
  return {
    backgroundColor: theme.surface,
    borderColor: isActive ? theme.textHigh : theme.edge,
  };
}

/** Uno de los dos cuadros. */
function RoleTile({ option, isActive, onPress }: RoleTileProps) {
  const theme = useTheme();
  const press = usePressMotion();

  return (
    <AnimatedPressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={`${option.label}. ${option.hint}`}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
      style={[styles.tile, tileColors(theme, isActive), press.style]}
    >
      <LineIcon
        path={FORM_ICON_PATHS[option.icon]}
        color={isActive ? theme.textHigh : theme.textLow}
        viewBox={FORM_ICON_VIEWBOX}
        side={ROLE_ICON_SIDE}
      />
      <Text style={[type.body, styles.tileLabel, { color: theme.textHigh }]}>{option.label}</Text>
      <Text style={[type.caption, styles.tileHint, { color: theme.textLow }]}>{option.short}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: gap.sm },
  row: { flexDirection: 'row', gap: gap.md },
  tile: {
    flex: 1,
    aspectRatio: 1,
    minHeight: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: gap.md,
    gap: gap.sm,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    borderWidth: size.frameBorder,
  },
  tileLabel: { textAlign: 'center' },
  tileHint: { textAlign: 'center' },
});
