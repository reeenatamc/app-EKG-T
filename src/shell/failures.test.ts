import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Ningun fallo se queda solo en la consola.
 *
 * DE DONDE SALE ESTE TEST. Cuatro acciones —recortar, disparar, traer de la
 * galeria y exportar el informe— capturaban su error, lo escribian con
 * `console.error` y no cambiaban nada en pantalla. Desde fuera eso es
 * indistinguible de un boton roto: se pulsa, no pasa nada, y no hay forma de
 * saber si toca reintentar o si la accion ya se hizo.
 *
 * LA REGLA NO ES «NO USES CONSOLE». El registro hace falta para depurar. La
 * regla es que hay dos cosas distintas y no pueden escribirse igual:
 *
 * - **Fallo**: lo que el usuario pidio no ha ocurrido. Se registra con
 *   `console.error`, y solo pueden hacerlo los dos modulos que ademas encienden
 *   una bandera que la interfaz pinta. Asi, por construccion, todo fallo acaba
 *   en algo que se ve.
 * - **Degradacion**: algo salio peor pero el usuario puede seguir —no se pudo
 *   consultar la lista de resoluciones, no se pudo borrar un archivo ya
 *   subido—. Se registra con `console.warn` y no se le cuenta a nadie, porque
 *   alarmar sobre algo que no impide nada solo gasta la atencion que hara falta
 *   el dia que si pase algo.
 *
 * Un `.catch` que no haga ninguna de las dos cosas se traga el fallo, y eso es
 * lo que rompe la suite.
 */

/** Donde puede vivir codigo de produccion. */
const ROOTS = ['src', 'app'];

/**
 * Los unicos modulos que pueden declarar un fallo.
 *
 * Los dos traducen el rechazo en estado que la interfaz pinta: `useTask`
 * enciende `hasFailed`, y `useAuthAction` enciende `failureReason`, que dibuja
 * `ErrorNotice`. Anadir un tercero significa haber escrito una tercera forma de
 * avisar, y eso hay que mirarlo despacio.
 */
const FAILURE_MODULES = ['src/auth/useAuthAction.ts', 'src/shell/useTask.ts'];

interface SourceFile {
  readonly path: string;
  readonly code: string;
}

/** Todos los archivos de produccion bajo las raices. */
function sourceFiles(): readonly SourceFile[] {
  const found: SourceFile[] = [];

  const walk = (dir: string): void => {
    for (const entry of readdirSync(dir)) {
      const path = join(dir, entry);

      if (statSync(path).isDirectory()) {
        walk(path);
      } else if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) {
        found.push({ path, code: readFileSync(path, 'utf8') });
      }
    }
  };

  ROOTS.forEach(walk);

  return found;
}

/** Captura un rechazo, en cualquiera de las dos formas del lenguaje. */
function catchesRejections(code: string): boolean {
  return /\.catch\(/.test(code) || /\}\s*catch\s*\(/.test(code);
}

describe('manejo de fallos', () => {
  const files = sourceFiles();

  it('recorre el codigo de produccion', () => {
    // Si el recorrido se rompiera, los tests de abajo pasarian vacios.
    expect(files.length).toBeGreaterThan(50);
  });

  it('solo declaran fallos los modulos que los hacen visibles', () => {
    const declaring = files
      .filter((file) => file.code.includes('console.error'))
      .map((file) => file.path);

    expect(declaring.sort()).toEqual([...FAILURE_MODULES].sort());
  });

  it('ningun modulo se traga un rechazo en silencio', () => {
    // Quien captura sin ser modulo de fallo tiene que dejar constancia de la
    // degradacion. Si no registra nada, el rechazo desaparece sin rastro.
    const silent = files
      .filter((file) => catchesRejections(file.code))
      .filter((file) => !FAILURE_MODULES.includes(file.path))
      .filter((file) => !file.code.includes('console.warn'))
      .map((file) => file.path);

    expect(silent).toEqual([]);
  });
});
