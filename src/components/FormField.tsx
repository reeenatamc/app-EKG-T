import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

/** Naturaleza del campo. Decide teclado, autocompletado y enmascarado. */
export type FormFieldKind = 'email' | 'password' | 'newPassword' | 'code' | 'text';

type InputBehaviour = Pick<
  TextInputProps,
  'keyboardType' | 'autoComplete' | 'secureTextEntry' | 'maxLength' | 'textContentType'
>;

const CODE_LENGTH = 6;

/**
 * Configuracion por tipo de campo.
 *
 * Vive aqui y no en cada pantalla para que el teclado y el autocompletado sean
 * consistentes: un campo de correo con teclado de texto, o una contrasena sin
 * autocompletado, son fallos que se repiten en cuanto cada formulario decide
 * por su cuenta.
 */
const BEHAVIOUR: Record<FormFieldKind, InputBehaviour> = {
  email: { keyboardType: 'email-address', autoComplete: 'email', textContentType: 'emailAddress' },
  password: { secureTextEntry: true, autoComplete: 'current-password' },
  newPassword: { secureTextEntry: true, autoComplete: 'new-password' },
  code: { keyboardType: 'number-pad', autoComplete: 'one-time-code', maxLength: CODE_LENGTH },
  text: {},
};

interface FormFieldProps {
  readonly kind: FormFieldKind;
  readonly label: string;
  readonly value: string;
  readonly onChangeText: (value: string) => void;
  readonly hint?: string;
}

/**
 * Campo de texto de formulario.
 *
 * Se apoya en superficie opaca, nunca en vidrio: un campo de entrada sobre
 * vidrio pierde contraste justo cuando el usuario necesita leer lo que escribe.
 *
 * La etiqueta esta siempre visible en lugar de usar solo un marcador de
 * posicion, que desaparece al escribir y deja al usuario sin saber que campo
 * esta rellenando.
 *
 * EL CODIGO SE COMPONE EN MONOESPACIADA GRANDE. `type.vital` no se usaba en
 * ninguna de las doce pantallas (medido en D.1) y esta es la pantalla cuyo
 * trabajo entero son seis cifras, asi que es su sitio: la anchura constante del
 * digito hace que los seis huecos se lean como seis huecos mientras se teclea.
 * Cualquier otro campo lleva prosa y va en Inter.
 *
 * @param kind Naturaleza del campo; decide teclado, autocompletado y composicion.
 * @param label Nombre visible del campo.
 * @param value Valor actual.
 * @param onChangeText Se invoca con el texto nuevo.
 * @param hint Aclaracion opcional bajo el campo.
 * @returns El campo renderizado.
 */
export function FormField({ kind, label, value, onChangeText, hint }: FormFieldProps) {
  const theme = useTheme();
  const isCode = kind === 'code';

  return (
    <View style={styles.container}>
      <Text style={[type.caption, { color: theme.textLow }]}>{label}</Text>
      <TextInput
        {...BEHAVIOUR[kind]}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize="none"
        style={[
          styles.input,
          isCode ? styles.code : styles.prose,
          // EL CAMPO VA HUNDIDO, no elevado. Sobre un lienzo hueso una caja
          // blanca con sombra se leeria como una tarjeta mas, y un campo de
          // entrada no es una tarjeta: es un hueco donde escribir. `canvas` es el
          // hueso en sombra, o sea justo eso. Las referencias de `inspo/` hacen
          // lo mismo: sus campos son un relleno mas oscuro que el lienzo, sin
          // contorno.
          { backgroundColor: theme.canvas, color: theme.textHigh },
        ]}
      />
      {hint === undefined ? null : (
        <Text style={[type.caption, { color: theme.textLow }]}>{hint}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: gap.xs },
  input: {
    minHeight: size.touchTarget,
    paddingHorizontal: gap.lg,
    paddingVertical: gap.md,
    borderRadius: radius.tile,
    borderCurve: 'continuous',
  },
  prose: type.body,
  code: { ...type.vital, textAlign: 'center', paddingHorizontal: gap.xs },
});
