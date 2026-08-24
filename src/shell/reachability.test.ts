import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Ninguna accion del almacen se queda sin puerta en la interfaz.
 *
 * DE DONDE SALE ESTE TEST. `retryStudy` y `discard` existian en la cola de
 * subida desde que se escribio, con sus transiciones probadas en
 * `queue.test.ts`, y **ninguna pantalla las llamaba**: la fila que si se
 * renderizaba solo sabia abrir, y el componente que tenia los dos botones no se
 * montaba en ningun sitio. Un estudio que agotaba sus tres intentos automaticos
 * se quedaba en la lista para siempre, y ni la compilacion ni las pruebas
 * decian nada, porque en codigo estaba todo escrito.
 *
 * Ese es el fallo que este test vigila, y por eso mira el almacen entero en vez
 * de comprobar dos nombres a mano: la proxima accion que se anada al almacen y
 * se olvide de conectar rompe la suite el mismo dia.
 *
 * QUE CUENTA COMO CONSUMO. Que la accion se lea por selector, o sea
 * `state.<nombre>`, que es la unica forma en que la usa quien esta fuera del
 * creador. Dentro del creador un almacen se llama a si mismo con `get().<algo>`,
 * asi que esa forma no cuenta y el guardia no se enmascara solo.
 *
 * No se exige que el consumidor este en OTRO archivo: `analyses.ts` alberga a
 * proposito el gancho que sondea —una pantalla montada dos veces no debe abrir
 * dos sondeos—, y esa cercania es correcta.
 *
 * QUE NO PRUEBA. Que se pueda llegar al boton, ni que este visible, ni que haga
 * lo correcto. Es un guardarrail contra el codigo muerto, no una prueba de
 * interfaz.
 */

/** Almacen a auditar: archivo e interfaz de estado dentro de el. */
interface AuditedStore {
  readonly file: string;
  readonly state: string;
}

const STORES: readonly AuditedStore[] = [
  { file: 'src/capture/uploadQueue.ts', state: 'UploadQueueState' },
  { file: 'src/ecg/analyses.ts', state: 'AnalysesState' },
];

/** Donde puede vivir un consumidor legitimo. */
const CONSUMER_ROOTS = ['src', 'app'];

/**
 * Extrae los nombres de las acciones declaradas en la interfaz de estado.
 *
 * Se leen del fuente y no de una lista escrita a mano a proposito: una lista a
 * mano se queda corta justo cuando alguien anade la accion que se va a olvidar
 * de conectar, que es el caso que este test existe para atrapar.
 *
 * @param source Contenido del archivo del almacen.
 * @returns Los nombres de las acciones, sin el campo de datos.
 */
function actionNames(source: string, stateInterface: string): readonly string[] {
  const block = source.split(`interface ${stateInterface} {`)[1]?.split('\n}')[0] ?? '';
  const declarations = block.matchAll(/readonly (\w+): \(/g);

  // El grupo siempre existe si hubo coincidencia, pero el modo estricto no lo
  // sabe: `flatMap` descarta el caso imposible sin una asercion de tipo.
  return [...declarations].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));
}

/** Todos los archivos de codigo bajo las raices. */
function consumerFiles(): readonly string[] {
  const found: string[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);

      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (/\.tsx?$/.test(entry) && !path.endsWith('.test.ts')) {
        found.push(path);
      }
    }
  };

  CONSUMER_ROOTS.forEach(walk);

  return found;
}

describe.each(STORES)('acciones de $file', ({ file, state }) => {
  const names = actionNames(readFileSync(file, 'utf8'), state);
  const consumers = consumerFiles().map((path) => readFileSync(path, 'utf8'));

  it('la interfaz declara acciones que auditar', () => {
    // Si el formato de la interfaz cambiara, el recorrido devolveria cero
    // nombres y todos los tests de abajo pasarian vacios.
    expect(names.length).toBeGreaterThan(0);
  });

  it.each(names)('%s se consume por selector', (name) => {
    const isConsumed = consumers.some((code) => code.includes(`state.${name}`));

    expect(isConsumed).toBe(true);
  });
});
