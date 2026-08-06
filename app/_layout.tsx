import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemedStatusBar } from '@/design/ThemedStatusBar';
import { ThemeProvider } from '@/design/theme';
import { useAppReady } from '@/design/useAppReady';

const styles = StyleSheet.create({ root: { flex: 1 } });

/**
 * Raiz de la navegacion.
 *
 * No renderiza nada hasta que la aplicacion esta lista, y el splash nativo
 * sigue visible mientras tanto. Espera dos cosas: las fuentes, para evitar el
 * salto tipografico de §6, y las preferencias, para no pintar un fotograma con
 * el tema equivocado.
 *
 * @returns El arbol de rutas envuelto en sus proveedores.
 */
export default function RootLayout() {
  const isAppReady = useAppReady();

  if (!isAppReady) {
    return null;
  }

  return (
    // GestureHandlerRootView debe envolver toda la aplicacion: sin el, los
    // gestos no llegan a registrarse en Android.
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          {/* headerShown en false de forma global: el chrome lo define §3 de la
              especificacion, no el router. Ninguna pantalla usa la cabecera por
              defecto de expo-router.

              La captura va como modal a pantalla completa y SIN barra de
              pestanas: desenfocar video en vivo es lo mas caro que puede hacer
              un movil, y esa pantalla ademas es oscura siempre. */}
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="capture" options={{ presentation: 'fullScreenModal' }} />
            <Stack.Screen name="playground" options={{ presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
