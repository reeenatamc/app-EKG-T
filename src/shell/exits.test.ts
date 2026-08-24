import { readFileSync } from 'node:fs';

/**
 * Toda pantalla apilada tiene una salida visible.
 *
 * QUE VIGILA ESTE TEST Y POR QUE ES ESTRUCTURAL. `headerShown` esta desactivado
 * de forma global en el layout raiz: el chrome lo define §3, no el router. Esa
 * decision es correcta y tiene un coste que no se ve al escribir una pantalla
 * nueva —**nadie dibuja el boton de volver por ti**—, y no se nota probando en
 * Android, donde el boton fisico tapa el agujero. Se nota en iOS, y sobre todo
 * en un `fullScreenModal`, que ademas no se cierra deslizando.
 *
 * Un test estatico no puede pulsar un boton ni saber si esta tapado. Lo que si
 * puede es exigir que el codigo de cada pantalla apilada mencione su salida, y
 * eso convierte un olvido silencioso en una compilacion roja.
 *
 * La lista se mantiene A MANO, igual que las de `palette.test.ts`: cuando
 * aparezca una pantalla apilada nueva habra que anadirla aqui, y ese es
 * exactamente el momento de pararse a pensar por donde se sale de ella.
 */

/** Pantalla que se apila encima de otra y por tanto necesita salida propia. */
interface StackedScreen {
  readonly file: string;
  /** Por que esta apilada. Es lo que justifica la exigencia. */
  readonly why: string;
  /** Marcas que el fuente debe contener para que la salida exista. */
  readonly required: readonly RegExp[];
}

const STACKED_SCREENS: readonly StackedScreen[] = [
  {
    file: 'src/screens/SettingsScreen.tsx',
    why: 'se abre desde Perfil',
    required: [/useGoBack\(/, /onBack=\{/],
  },
  {
    file: 'src/screens/StudyDetailScreen.tsx',
    why: 'se abre desde el Historial y admite enlace profundo',
    required: [/useGoBack\(/, /onBack=\{/],
  },
  {
    file: 'src/screens/CameraScreen.tsx',
    why: 'se presenta como fullScreenModal, que en iOS no se cierra deslizando',
    required: [/icon="close"/, /onPress=\{onClose\}/],
  },
];

/**
 * Destinos de la barra de pestanas.
 *
 * La regla al reves, y no es simetria decorativa: un boton de volver en una
 * pestana lleva a otra pestana hermana, o sea que convierte una navegacion plana
 * en un laberinto donde retroceder no deshace nada.
 */
const TAB_SCREENS = [
  'src/screens/HomeScreen.tsx',
  'src/screens/HistoryScreen.tsx',
  'src/screens/ProfileScreen.tsx',
] as const;

function read(file: string): string {
  return readFileSync(file, 'utf8');
}

describe('salidas de pantalla', () => {
  it.each(STACKED_SCREENS)('$file lleva salida porque $why', ({ file, required }) => {
    const source = read(file);

    for (const mark of required) {
      expect(source).toMatch(mark);
    }
  });

  it.each(TAB_SCREENS)('%s no lleva boton de volver', (file) => {
    expect(read(file)).not.toMatch(/onBack=\{/);
  });

  it('la cabecera solo dibuja la salida cuando se la pasan', () => {
    // Si el guardia desapareciera, las tres pestanas se llenarian de botones de
    // volver sin que ningun test de arriba fallara: ellas no pasan `onBack`.
    expect(read('src/components/ScreenHeader.tsx')).toMatch(/onBack === undefined \? null :/);
  });
});
