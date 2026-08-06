import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { StyleSheet, Text, View } from 'react-native';

import { PLAYGROUND_TEXT } from '@/constants/text';
import { spring } from '@/design/motion';
import { useTheme } from '@/design/theme';
import { gap, radius, size } from '@/design/tokens';
import { type } from '@/design/type';

const HANDLE = 56;

/**
 * Comprobacion de que los gestos funcionan de verdad en el dispositivo.
 *
 * No basta con que el modulo enlace: este control se arrastra con
 * react-native-gesture-handler y se anima con Reanimated **en el hilo de UI**,
 * que es exactamente el mecanismo que necesitaran las esquinas arrastrables del
 * recorte en la Etapa 3. Si algo del enlazado nativo estuviera mal, aqui no se
 * moveria nada.
 *
 * Se conserva en el banco de pruebas porque documenta que la cadena
 * gesto-a-hilo-de-UI esta verificada en hardware real.
 *
 * @returns El control arrastrable de prueba.
 */
export function GestureProbe() {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[type.caption, { color: theme.textLow }]}>{PLAYGROUND_TEXT.gestureHint}</Text>
      <DraggableHandle />
    </View>
  );
}

/** El control que se arrastra. Vuelve a su sitio con un resorte al soltarlo. */
function DraggableHandle() {
  const theme = useTheme();
  const offsetX = useSharedValue(0);
  const offsetY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onChange((event) => {
      offsetX.value += event.changeX;
      offsetY.value += event.changeY;
    })
    .onEnd(() => {
      offsetX.value = withSpring(0, spring);
      offsetY.value = withSpring(0, spring);
    });

  const handleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }, { translateY: offsetY.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.handle, handleStyle, { backgroundColor: theme.textHigh }]}>
        <Text style={[type.caption, { color: theme.canvas }]}>{PLAYGROUND_TEXT.gestureLabel}</Text>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: gap.lg,
    borderRadius: radius.tile,
    gap: gap.md,
  },
  handle: {
    width: HANDLE,
    height: HANDLE,
    minWidth: size.touchTarget,
    minHeight: size.touchTarget,
    borderRadius: HANDLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
