const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Donde se generan los archivos de compilacion nativa de la app en Windows.
 *
 * Se puede cambiar con ANDROID_CXX_ROOT si la unidad C: no sirve. Tiene que ser
 * una ruta corta: ese es todo el proposito.
 */
const WINDOWS_NATIVE_BUILD_ROOT = process.env.ANDROID_CXX_ROOT ?? 'C:/ncx/app';

/** Donde empieza el bloque de configuracion de Android en app/build.gradle. */
const ANDROID_BLOCK = /^android \{$/m;

/**
 * Saca la carpeta de compilacion nativa (.cxx) de la app a una ruta corta, solo
 * en Windows.
 *
 * POR QUE HACE FALTA. Windows corta las rutas en 260 caracteres, y comprueba ese
 * limite ANTES de resolver los `..`, asi que una ruta perfectamente valida puede
 * rechazarse por como esta escrita. Al compilar, el modulo de la app tiene que
 * compilar fuentes que viven fuera de su arbol, y CMake codifica la ruta entera
 * de cada fuente dentro del nombre de su archivo objeto:
 *
 *   <proyecto>\android\app\.cxx\Debug\<hash>\arm64-v8a
 *   + safeareacontext_autolinked_build\CMakeFiles\react_codegen_safeareacontext.dir\
 *     C_\...\react-native-safe-area-context\common\cpp\react\renderer\...\X.cpp.o
 *
 * COMO SE MANIFIESTA. No como "ruta demasiado larga", sino asi:
 *
 *   ninja: error: mkdir(...): No such file or directory
 *
 * El directorio padre existe y se lee sin problemas con cualquier otra
 * herramienta. CMake lo avisa antes, en un mensaje facil de perderse entre miles
 * de lineas: «has 176 characters. The maximum full path to an object file is
 * 250 characters (see CMAKE_OBJECT_PATH_MAX)».
 *
 * `buildStagingDirectory` es la via documentada del sistema de compilacion de
 * Android para elegir donde se genera `.cxx`. Se declara dentro del bloque
 * `android` de la propia app, que es el unico momento en que se puede escribir:
 * intentarlo desde fuera, por ejemplo con un `subprojects` en el build.gradle
 * raiz, falla con «It is too late to set buildStagingDirectory».
 *
 * ESTO CUBRE SOLO EL MODULO DE LA APP. Las librerias nativas de node_modules
 * tienen el mismo problema y no se arregla desde aqui, sino colocando
 * `node_modules` en una ruta corta. Eso es configuracion de la maquina, no del
 * repositorio.
 *
 * SOLO WINDOWS. En macOS y Linux no existe tal limite y el archivo generado
 * queda identico al de siempre, asi que esto no cambia nada para quien no
 * compile aqui, ni en integracion continua.
 *
 * Se aplica con un plugin y no editando `android/app/build.gradle` a mano porque
 * ese directorio lo regenera `expo prebuild` y el cambio se perderia en el
 * siguiente `run:android`, reapareciendo el fallo como si se hubiera roto solo.
 *
 * @param {import('expo/config').ExpoConfig} config Configuracion de Expo.
 * @returns {import('expo/config').ExpoConfig} La configuracion, intacta fuera de Windows.
 */
module.exports = function withShortNativeBuildDir(config) {
  if (process.platform !== 'win32') {
    return config;
  }

  return withAppBuildGradle(config, (modConfig) => {
    if (modConfig.modResults.language !== 'groovy') {
      throw new Error('withShortNativeBuildDir espera app/build.gradle en Groovy, no en Kotlin.');
    }

    // prebuild puede ejecutarse sobre un android/ ya generado.
    if (modConfig.modResults.contents.includes('buildStagingDirectory')) {
      return modConfig;
    }

    if (!ANDROID_BLOCK.test(modConfig.modResults.contents)) {
      throw new Error('withShortNativeBuildDir no encontro el bloque android en app/build.gradle.');
    }

    modConfig.modResults.contents = modConfig.modResults.contents.replace(
      ANDROID_BLOCK,
      [
        'android {',
        '    externalNativeBuild {',
        '        cmake {',
        `            buildStagingDirectory = new File("${WINDOWS_NATIVE_BUILD_ROOT}")`,
        '        }',
        '    }',
        '',
      ].join('\n'),
    );

    return modConfig;
  });
};
