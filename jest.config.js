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
  },
};
