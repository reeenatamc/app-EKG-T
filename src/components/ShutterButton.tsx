import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { CAMERA_SCREEN_TEXT } from '@/constants/text';
import { opacity, paperDark, size } from '@/design/tokens';

interface ShutterButtonProps {
  readonly onPress: () => void;
  readonly busy: boolean;
  readonly disabled: boolean;
}

/**
 * Boton de obturador.
 *
 * Sus colores no siguen el tema: se apoya sobre la vista previa de la camara,
 * que es siempre oscura por motivos opticos, asi que toma el contraste fijo del
 * tema oscuro independientemente del tema de la aplicacion.
 *
 * La reaccion al tacto la resuelve la funcion de estilo de Pressable, que actua
 * en el hilo nativo. Por eso la retroalimentacion no depende de que React haya
 * terminado de renderizar ni de que la captura haya empezado.
 *
 * @param onPress Accion de captura.
 * @param busy Cierto mientras la captura esta en curso; muestra un indicador.
 * @param disabled Cierto cuando la camara aun no esta lista.
 * @returns El boton de obturador.
 */
export function ShutterButton({ onPress, busy, disabled }: ShutterButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={CAMERA_SCREEN_TEXT.shutterLabel}
      accessibilityState={{ disabled: disabled || busy }}
      onPress={onPress}
      disabled={disabled || busy}
      style={styles.ring}
    >
      {({ pressed }) => (
        <View style={[styles.core, pressed ? styles.corePressed : null]}>
          {busy ? <ActivityIndicator color={paperDark.canvas} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ring: {
    width: size.shutterOuter,
    height: size.shutterOuter,
    borderRadius: size.shutterOuter / 2,
    borderWidth: size.frameBorder,
    borderColor: paperDark.textHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: size.shutterInner,
    height: size.shutterInner,
    borderRadius: size.shutterInner / 2,
    backgroundColor: paperDark.textHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  corePressed: { opacity: opacity.disabled },
});
