import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { FORM_ICON_PATHS, FORM_ICON_VIEWBOX } from '@/components/icons/formIcons';
import { LineIcon } from '@/components/icons/LineIcon';
import { useTheme, type Theme } from '@/design/theme';
import { brand, gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

export type FormFieldKind = 'email' | 'password' | 'newPassword' | 'code' | 'text';

type InputBehaviour = Pick<
  TextInputProps,
  'keyboardType' | 'autoComplete' | 'secureTextEntry' | 'maxLength' | 'textContentType'
>;

const CODE_LENGTH = 6;

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

export function FormField(props: FormFieldProps) {
  if (props.kind === 'code') {
    return <CodeInputField {...props} />;
  }
  return <TextInputField {...props} />;
}

function CodeInputField({ label, value, onChangeText, hint }: FormFieldProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const digits = value.split('').slice(0, CODE_LENGTH);

  return (
    <View style={styles.container}>
      <Text style={[type.caption, styles.codeLabel, { color: theme.textLow }]}>{label}</Text>
      <View style={styles.codeRow}>
        <CodeCells digits={digits} isFocused={isFocused} />
        <TextInput
          {...BEHAVIOUR.code}
          accessibilityLabel={label}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          autoFocus
          style={styles.codeHiddenInput}
        />
      </View>
      {hint === undefined ? null : (
        <Text style={[type.caption, styles.codeLabel, { color: theme.textLow }]}>{hint}</Text>
      )}
    </View>
  );
}

function CodeCells({
  digits,
  isFocused,
}: {
  readonly digits: string[];
  readonly isFocused: boolean;
}) {
  const activeIndex = Math.min(digits.length, CODE_LENGTH - 1);
  return (
    <>
      {Array.from({ length: CODE_LENGTH }).map((_, index) => (
        <CodeCell
          key={index}
          index={index}
          digit={digits[index] ?? ''}
          activeIndex={activeIndex}
          isFocused={isFocused}
        />
      ))}
    </>
  );
}

interface CodeCellProps {
  readonly index: number;
  readonly digit: string;
  readonly activeIndex: number;
  readonly isFocused: boolean;
}

function CodeCell({ index, digit, activeIndex, isFocused }: CodeCellProps) {
  const theme = useTheme();
  const isActive = isFocused && index === activeIndex;
  const isFilled = digit.length > 0;

  return (
    <View style={codeCellStyle(theme, isActive, isFilled)}>
      {isFilled ? (
        <Text style={[type.vital, styles.codeDigitText, { color: theme.textHigh }]}>{digit}</Text>
      ) : (
        <View style={codeDotStyle(theme, isActive)} />
      )}
    </View>
  );
}

/**
 * Una celda del codigo, segun tenga cifra, sea la que toca, o este vacia.
 *
 * LOS COLORES SALEN DEL TEMA, no de un ternario sobre isDark. El tema ya sabe
 * que es una superficie y que es un filo en cada modo; repetirlo aqui a mano
 * significa que el dia que la paleta cambie, estas seis celdas se queden con la
 * anterior sin que nadie se entere.
 *
 * Y LA CELDA ACTIVA NO SE ELEVA, solo cambia de color. Elevarla obligaba a
 * Android a rehacer la vista, y rehacerla mientras el campo oculto tiene el foco
 * se lo quita: el mismo fallo que impedia escribir en toda la aplicacion.
 */
function codeCellStyle(theme: Theme, isActive: boolean, isFilled: boolean) {
  return [
    styles.codeCell,
    {
      backgroundColor: theme.surface,
      borderColor: isActive || isFilled ? brand.edge : theme.edge,
    },
  ];
}

/** El punto de una celda todavia vacia. */
function codeDotStyle(theme: Theme, isActive: boolean) {
  return [styles.codePlaceholderDot, { backgroundColor: isActive ? brand.edge : theme.gridBold }];
}

function TextInputField({ kind, label, value, onChangeText, hint }: FormFieldProps) {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[type.caption, { color: theme.textLow, marginLeft: gap.xs }]}>{label}</Text>
      <InputBox
        kind={kind}
        label={label}
        value={value}
        onChangeText={onChangeText}
        isFocused={isFocused}
        onFocusChange={setIsFocused}
      />
      {hint === undefined ? null : (
        <Text style={[type.caption, { color: theme.textLow, marginLeft: gap.xs }]}>{hint}</Text>
      )}
    </View>
  );
}

interface InputBoxProps extends FormFieldProps {
  readonly isFocused: boolean;
  readonly onFocusChange: (focused: boolean) => void;
}

/** La marca de que se pide en este hueco. Se enciende con el foco. */
function FieldIcon({
  kind,
  isFocused,
}: {
  readonly kind: FormFieldKind;
  readonly isFocused: boolean;
}) {
  const theme = useTheme();
  const path = resolveFieldIcon(kind);

  if (path === null) {
    return null;
  }

  return (
    <LineIcon
      path={path}
      color={isFocused ? brand.edge : theme.textLow}
      viewBox={FORM_ICON_VIEWBOX}
      side={size.fieldIcon}
    />
  );
}

function InputBox({ kind, label, value, onChangeText, isFocused, onFocusChange }: InputBoxProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.inputWrapper,
        { backgroundColor: theme.surface, borderColor: isFocused ? brand.edge : theme.edge },
      ]}
    >
      <FieldIcon kind={kind} isFocused={isFocused} />
      <TextInput
        {...BEHAVIOUR[kind]}
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        autoCapitalize="none"
        style={[styles.input, type.body, { color: theme.textHigh }]}
      />
    </View>
  );
}

function resolveFieldIcon(kind: FormFieldKind) {
  if (kind === 'email') return FORM_ICON_PATHS.email;
  if (kind === 'password' || kind === 'newPassword') return FORM_ICON_PATHS.password;
  return null;
}

const styles = StyleSheet.create({
  container: { gap: gap.xs },
  /**
   * EL ARO DE FOCO CAMBIA DE COLOR Y NADA MAS.
   *
   * Tuvo `elevation` y una sombra, y eso impedia escribir en la aplicacion.
   * Cambiar la elevacion de una vista en Android obliga al sistema a rehacerla
   * para poder dibujar la sombra, y al rehacerla el campo que tiene dentro
   * pierde el foco. O sea: se tocaba el campo, se enfocaba, la sombra aparecia,
   * el foco se caia y el teclado no llegaba a salir. Medido con dumpsys
   * input_method: mInputShown seguia en false despues de tocar.
   *
   * El color no toca la vista nativa, asi que el aro se ve y el foco se queda.
   */
  inputWrapper: {
    minHeight: size.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.pill,
    borderWidth: size.hairline,
    paddingHorizontal: gap.lg,
    gap: gap.md,
  },
  input: {
    flex: 1,
    minHeight: size.touchTarget,
    paddingVertical: gap.sm,
    paddingHorizontal: gap.xs,
  },
  codeLabel: {
    textAlign: 'center',
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    paddingVertical: gap.sm,
  },
  codeCell: {
    width: 48,
    height: 56,
    borderRadius: radius.tile,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeDigitText: {
    fontSize: 26,
    lineHeight: 32,
    textAlign: 'center',
  },
  codePlaceholderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  codeHiddenInput: {
    ...StyleSheet.absoluteFill,
    opacity: 0.01,
    color: 'transparent',
  },
});
