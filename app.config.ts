import type { ExpoConfig } from 'expo/config';

import packageJson from './package.json';

// Los dos colores de la identidad que necesita la configuracion nativa.
//
// SE ESCRIBEN A MANO Y NO SE IMPORTAN DE tokens.ts, y no por gusto: el cargador
// de configuracion de Expo transpila este archivo a CommonJS y no resuelve
// modulos .ts propios. `import { identity } from './src/design/tokens'` falla con
// «Cannot find module», verificado con `npx expo config`.
//
// Para que no se desincronicen, `src/design/palette.test.ts` comprueba que estos
// dos valores son exactamente `identity.bone` e `identity.plum`. Si alguien
// cambia la paleta y se olvida de este archivo, la suite lo dice.
const BONE = '#FCF8F4';
const PLUM = '#171019';

// Identificador unico de la app en las tiendas. iOS y Android comparten valor
// para evitar divergencias entre plataformas.
const BUNDLE_IDENTIFIER = 'com.reeenatamc.appekg';

// Respaldo cuando .env no existe (por ejemplo, en un clon recien hecho).
// Es un marcador de posicion, no una URL real de produccion.
const DEFAULT_API_BASE_URL = 'http://localhost:8000';

// Texto que muestra el sistema operativo al pedir el permiso. iOS rechaza en
// revision las apps que piden camara sin explicar para que.
const CAMERA_PERMISSION_REASON =
  'EKG Reader necesita la cámara para fotografiar el electrocardiograma en papel.';

/**
 * Configuracion de la aplicacion Expo.
 *
 * Se usa app.config.ts en lugar de app.json porque necesita leer valores de
 * process.env en tiempo de compilacion, algo que un JSON estatico no permite.
 *
 * La version no se declara aqui: se toma de package.json para que exista una
 * unica fuente de verdad y no puedan desincronizarse.
 */
const config: ExpoConfig = {
  name: 'EKG Reader',
  slug: 'app-ekg',
  version: packageJson.version,

  // expo-router lo necesita para resolver enlaces profundos entre rutas.
  scheme: 'app-ekg',
  orientation: 'portrait',
  icon: './assets/icon.png',

  // Declara que la aplicacion gestiona su propio claro y oscuro. Sin esto,
  // Android y sobre todo MIUI aplican modo oscuro forzado y repintan las vistas
  // por su cuenta: el modo Paper se veia oscurecido mientras el lienzo Skia,
  // que es superficie de GPU y no una View, conservaba sus colores reales.
  // Requiere expo-system-ui; sin ese paquete la clave queda inerte.
  userInterfaceStyle: 'automatic',

  ios: {
    bundleIdentifier: BUNDLE_IDENTIFIER,
    supportsTablet: true,
  },

  android: {
    package: BUNDLE_IDENTIFIER,
    adaptiveIcon: {
      // Era #E6F4FE, un azul claro de plantilla que no esta en tokens.ts y no
      // aparece en ningun otro sitio de la aplicacion.
      backgroundColor: BONE,
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },

  plugins: [
    // Renuncia al modo oscuro forzado de Android. `userInterfaceStyle` solo curo
    // la mitad del problema; el motivo completo esta en el propio plugin.
    './plugins/withoutForcedDark',

    // ANTES NO HABIA NINGUNA CLAVE DE SPLASH, asi que el primer fotograma del
    // producto era la pantalla nativa por defecto: casi blanca y vacia. El
    // fondo se declara por tema para que en un dispositivo en oscuro el
    // arranque no sea un destello.
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 180,
        resizeMode: 'contain',
        backgroundColor: BONE,
        dark: {
          image: './assets/splash-icon-dark.png',
          backgroundColor: PLUM,
        },
      },
    ],

    [
      'expo-camera',
      {
        cameraPermission: CAMERA_PERMISSION_REASON,

        // Los tres valores por defecto del plugin activan cosas que esta app no
        // usa. Se desactivan de forma explicita:
        //
        // recordAudioAndroid    por defecto true  -> anadiria RECORD_AUDIO.
        // microphonePermission  sin valor         -> el plugin cae en su texto
        //                                            por defecto y escribe
        //                                            NSMicrophoneUsageDescription
        //                                            en el Info.plist. Solo el
        //                                            valor false lo elimina.
        // barcodeScannerEnabled por defecto true  -> arrastra MLKit a Android
        //                                            para un lector que no
        //                                            existe en el producto.
        recordAudioAndroid: false,
        microphonePermission: false,
        barcodeScannerEnabled: false,
      },
    ],

    // Necesario para compartir el informe exportado. Anade la configuracion
    // nativa de la hoja de comparticion; sin el, Sharing.isAvailableAsync()
    // devuelve false en una compilacion de desarrollo.
    'expo-sharing',
  ],

  // Todo lo que este en "extra" queda accesible en tiempo de ejecucion a
  // traves de expo-constants. Es la via para pasar configuracion al cliente.
  extra: {
    apiBaseUrl: process.env.API_BASE_URL ?? DEFAULT_API_BASE_URL,
  },
};

export default config;
