import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useBootDestination } from '@/auth/useBootDestination';
import { useSplashExit } from '@/auth/useSplashExit';
import { SPLASH_TEXT } from '@/constants/authText';
import { Background } from '@/design/Background';
import { SplashBeat } from '@/design/SplashBeat';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

/** Cuanto tarda el latido en recorrer la pantalla una vez. */
const BEAT_DURATION_MS = 1000;

/**
 * Fraccion del ancho que ocupa el latido.
 *
 * Casi todo, y ese es el punto. Antes iba dentro de una tarjeta de 280 puntos
 * con borde y sombra, o sea que lo primero que veia alguien al abrir la
 * aplicacion era un recuadro. Un recuadro es una pieza de interfaz, y esta
 * pantalla no tiene interfaz: no hay nada que tocar, nada que leer, nada que
 * decidir. Solo hay que esperar un segundo.
 */
const BEAT_WIDTH_RATIO = 0.82;

/** Proporcion del latido. Ancho y bajo, como la tira de papel de la que sale. */
const BEAT_ASPECT = 3.4;

/**
 * La pantalla de arranque.
 *
 * SIN TARJETA Y SIN ETIQUETAS. Lo unico que se ve es el latido cruzando la
 * pantalla y el nombre debajo. Es la unica pantalla de la aplicacion donde no se
 * puede hacer nada, asi que cualquier elemento que se anada aqui es decoracion
 * sobre decoracion: un borde que no contiene nada, una insignia que no informa
 * de nada, una etiqueta que repite lo que el nombre ya dijo.
 *
 * El latido va suelto sobre el lienzo, a lo ancho, y esa es toda la puesta en
 * escena. El §8 lo llama el elemento de firma; una firma no se enmarca.
 *
 * El bloom de la capa 2 se apaga a proposito: aqui el latido ya es el sujeto, y
 * un halo difuso detras del mismo trazo lo unico que hace es engordarlo.
 *
 * @returns La pantalla de arranque.
 */
export function SplashScreen() {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const destination = useBootDestination();
  const opacity = useSplashExit(destination);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const beatWidth = Math.round(width * BEAT_WIDTH_RATIO);

  return (
    <Background showSignalBloom={false}>
      <Animated.View style={[styles.container, fade]}>
        <SplashBeat
          durationMs={BEAT_DURATION_MS}
          width={beatWidth}
          height={Math.round(beatWidth / BEAT_ASPECT)}
          color={theme.bloom}
        />
        <View style={styles.brand}>
          <Text style={[type.display, { color: theme.textHigh }]}>{SPLASH_TEXT.appName}</Text>
        </View>
      </Animated.View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: gap.xl,
  },
  brand: { alignItems: 'center' },
});
