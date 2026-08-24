/**
 * Configuracion de Jest.
 *
 * El preset jest-expo aporta las transformaciones de Babel y los mocks de los
 * modulos nativos de React Native. Sin el, cualquier import de "expo" falla al
 * ejecutarse en Node.
 */
module.exports = {
  preset: 'jest-expo',

  // Jest no lee los "paths" de tsconfig.json, asi que el alias se declara aqui
  // por segunda vez. Si cambia en tsconfig.json, hay que cambiarlo aqui tambien.
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',

    // El preset de Expo no cubre AsyncStorage: su modulo nativo no existe en
    // Node, asi que cualquier prueba que alcance un almacen persistido reventaba
    // al importarlo, aunque no llegase a leer ni escribir nada. El sustituto lo
    // publica el propio paquete.
    //
    // VA AQUI Y NO EN `setupFiles`. Esa clave la define el preset con los dos
    // arranques de React Native y de Expo, y declararla otra vez no la amplia:
    // la sustituye, dejando el entorno de pruebas a medio montar.
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
  },
};
