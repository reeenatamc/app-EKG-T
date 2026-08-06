import { StyleSheet, Text, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { useBootDestination } from '@/auth/useBootDestination';
import { useSplashExit } from '@/auth/useSplashExit';
import { SPLASH_TEXT } from '@/constants/authText';
import { Background } from '@/design/Background';
import { SplashBeat } from '@/design/SplashBeat';
import { useTheme } from '@/design/theme';
import { gap } from '@/design/tokens';
import { type } from '@/design/type';

/**
 * Duracion del trazo del latido.
 *
 * Medido en el Redmi Note 9 Pro, el arranque resuelve su destino entre 810 y
 * 843 ms. Pero esas son medidas **en caliente**: un arranque en frio, con la
 * bateria baja o con el sistema recuperando procesos que habia matado, sera
 * bastante mas lento.
 *
 * Por eso el trazo se fija DELIBERADAMENTE POR ENCIMA del arranque medido, y no
 * ajustado a el. Un latido que termina y se queda esperando se ve peor que uno
 * que no llega al final: para eso existe el desvanecimiento de salida, y es
 * mejor confiar en el que apurar el margen.
 *
 * Si el arranque cambia de orden de magnitud —por ejemplo cuando la sesion pase
 * por red— hay que volver a medir. La instrumentacion vive en useSplashExit.
 */
const BEAT_DURATION_MS = 1000;

/**
 * Pantalla de arranque.
 *
 * Presenta el unico momento llamativo de la aplicacion mientras se decide a
 * donde ir. No lleva el trazado difuso del fondo: ya hay un latido en pantalla,
 * y dos competirian.
 *
 * @returns La pantalla de arranque.
 */
export function SplashScreen() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const destination = useBootDestination();
  const opacity = useSplashExit(destination);
  const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Background showSignalBloom={false}>
      <Animated.View style={[styles.container, fade]}>
        <SplashBeat
          durationMs={BEAT_DURATION_MS}
          width={width}
          height={height}
          color={theme.bloom}
        />
        <Text style={[type.display, styles.name, { color: theme.textHigh }]}>
          {SPLASH_TEXT.appName}
        </Text>
      </Animated.View>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  name: { marginTop: gap.xl * 4, textAlign: 'center' },
});
