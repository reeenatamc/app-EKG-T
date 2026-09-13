import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useBootDestination } from '@/auth/useBootDestination';
import { useSplashExit } from '@/auth/useSplashExit';
import { SPLASH_TEXT } from '@/constants/authText';
import { Background } from '@/design/Background';
import { SplashHeart } from '@/design/SplashHeart';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

/**
 * Cuanto dura el guion del corazon: giro, trazo y latido doble.
 *
 * LOS MISMOS 1800 MS QUE EL LATIDO ANTERIOR, y no por casualidad. `useSplashExit`
 * calcula su minimo sobre esta cifra; alargar la animacion alargaria la espera
 * del usuario cada vez que abre la aplicacion. Lo que se gano en espectaculo
 * cabe en el mismo tiempo.
 */
const BEAT_DURATION_MS = 1800;

/**
 * La pantalla de arranque.
 *
 * SIN TARJETA Y SIN ETIQUETAS. Lo unico que se ve es el corazon con el latido
 * cruzando la pantalla y el nombre debajo. Es la unica pantalla de la aplicacion
 * donde no se puede hacer nada, asi que cualquier elemento que se anada aqui es
 * decoracion sobre decoracion.
 *
 * El trazo sigue yendo de borde a borde: la pantalla es una ventana sobre un
 * registro que sigue fuera de ella. El corazon es la firma de §8 (ver D-27).
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

  return (
    <Background showSignalBloom={false}>
      <Animated.View style={[styles.container, fade]}>
        <SplashHeart
          durationMs={BEAT_DURATION_MS}
          width={Math.round(width)}
          isDark={theme.mode === 'dark'}
          traceColor={theme.bloom}
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
