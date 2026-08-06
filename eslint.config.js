// Formato "flat config": ESLint 9 ya no admite .eslintrc.
// Referencia: https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

// Limite de lineas por funcion exigido por los estandares del proyecto.
const MAX_FUNCTION_LINES = 30;

module.exports = defineConfig([
  // android/ e ios/ los regenera Expo con prebuild: no son codigo fuente propio.
  globalIgnores(['android/*', 'ios/*', '.expo/*', 'dist/*', 'coverage/*', 'expo-env.d.ts']),

  expoConfig,

  // Debe ir despues de expoConfig para que Prettier gane en conflictos de formato.
  eslintPluginPrettierRecommended,

  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // El preset de Expo las deja en "warn". Aqui son errores porque los
      // estandares del proyecto las tratan como innegociables.
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

      'max-lines-per-function': [
        'error',
        { max: MAX_FUNCTION_LINES, skipBlankLines: true, skipComments: true },
      ],

      eqeqeq: ['error', 'always'],

      // console.warn y console.error son diagnosticos legitimos y deben poder
      // usarse sin ruido. console.log si se vigila: casi siempre es un resto de
      // depuracion. Cuando es intencionado, se justifica con un disable puntual.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },

  {
    files: ['**/*.test.ts', '**/*.test.tsx'],
    rules: {
      // Un describe agrupa muchos casos y crece de forma natural. El limite de
      // lineas busca acotar la complejidad del codigo de produccion, no la
      // longitud de una suite de pruebas.
      'max-lines-per-function': 'off',
    },
  },

  {
    // Configuracion y plugins de compilacion: se ejecutan en Node, no en React
    // Native. plugins/ contiene plugins de configuracion de Expo, que corren en
    // tiempo de prebuild.
    files: ['*.config.js', 'jest.config.js', 'eslint.config.js', 'plugins/*.js'],
    languageOptions: {
      globals: { module: 'writable', require: 'readonly', process: 'readonly' },
    },
  },
]);
