import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { brand, identity, paperDark, paperLight, semantic } from '@/design/tokens';

/**
 * Guardarrailes de paleta, comprobados sobre el codigo fuente.
 *
 * QUE PRUEBAN ESTOS TESTS Y QUE NO. Un test estatico no puede medir la geometria
 * de lo que se pinta: no sabe si una superficie tiene cuarenta puntos o
 * cuatrocientos. Lo que si puede es vigilar **desde donde** se consume cada
 * familia de color, y eso convierte una regla de diseno en una regla que falla la
 * compilacion cuando alguien la rompe sin darse cuenta —incluida yo dentro de
 * tres semanas—.
 *
 * Por eso la regla de tamano de §12.9 se codifica como lista blanca de modulos:
 * los modulos que dibujan superficies grandes estan enumerados, y ningun otro
 * archivo puede tocar el carmin de marca. Si aparece un modulo nuevo que de
 * verdad necesita rellenar grande, se anade aqui **a mano**, que es exactamente
 * el momento de pararse a pensar si es grande de verdad.
 */

const ROOTS = ['src', 'app'];

// Las listas no incluyen `tokens.ts`: ahi las familias se DEFINEN, no se
// consumen, y sus propios valores se escriben sin prefijo de grupo.

/**
 * Modulos que pueden rellenar con el carmin de marca, en cualquiera de sus tres
 * densidades: `carmine`, `carmineLit` y `carmineDeep`.
 *
 * `TileGlow` NO esta en la lista y no debe estarlo: recibe los colores por prop,
 * o sea que no decide nada. Quien decide es quien lo llama.
 */
const BRAND_FILL_ALLOWED = [
  // Boton de accion principal: ocupa el ancho completo de la pantalla.
  'src/components/ActionButton.tsx',
  // Modulo hero del inicio: la superficie mas grande de la aplicacion.
  'src/components/BentoTile.tsx',
  // Pestana activa. NO rellena: tine el icono y la etiqueta, que es la
  // convencion de iOS para el acento y lo que §12.9 deja fuera de la
  // prohibicion. El test de abajo comprueba que ahi no hay ningun relleno.
  'src/components/TabBarItem.tsx',
];

/**
 * Modulos que pueden pintar la superficie de subtarjeta.
 *
 * Misma logica que el carmin: es un relleno grande y con tinta propia, o sea que
 * fuera del bento no significa nada. `HomeScreen` entra solo por la tinta del
 * identificador, que va sobre una de esas tarjetas.
 */
const TINTED_ALLOWED = ['src/components/BentoTile.tsx', 'src/screens/HomeScreen.tsx'];

/** Modulos que pueden tocar la jerarquia de alarma de la IEC 60601-1-8. */
// `Notice` sustituye a `ErrorNotice` en esta lista: el color de alarma se movio
// con la barra lateral cuando la presentacion se separo de la traduccion de
// causas. `ErrorNotice` ya no pinta, solo elige copy.
const SEMANTIC_ALLOWED = ['src/components/Notice.tsx'];

/** Modulos que pueden tocar la atmosfera del lienzo. */
const AURORA_ALLOWED = ['src/design/Aurora.tsx'];

/** Archivos donde un literal de color es legitimo. */
const HEX_ALLOWED = ['src/design/tokens.ts'];

interface SourceFile {
  readonly path: string;
  readonly code: string;
}

/**
 * Quita comentarios y cadenas de importacion.
 *
 * Es imprescindible: media docena de archivos explican EN UN COMENTARIO por que
 * NO usan `semantic.alarmHigh`, y sin este paso el test los denunciaria justo por
 * documentar la regla que cumplen.
 */
function stripComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

function collect(dir: string, out: SourceFile[]): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);

    if (statSync(full).isDirectory()) {
      collect(full, out);
      continue;
    }

    if (!/\.tsx?$/.test(entry) || entry.endsWith('.test.ts') || entry.endsWith('.test.tsx')) {
      continue;
    }

    out.push({
      path: relative(process.cwd(), full).split(sep).join('/'),
      code: stripComments(readFileSync(full, 'utf8')),
    });
  }
}

const SOURCES: readonly SourceFile[] = (() => {
  const files: SourceFile[] = [];
  for (const root of ROOTS) {
    collect(join(process.cwd(), root), files);
  }
  return files;
})();

/**
 * Devuelve el objeto de estilo `{...}` que contiene la posicion dada.
 *
 * Hace falta emparejar llaves de verdad y no mirar el archivo entero: el aviso de
 * error tiene un `flex: 1` en su cuerpo y una barra lateral de tres puntos, y
 * juzgarlos juntos daria un falso positivo sobre el unico modulo que usa la
 * alarma correctamente.
 *
 * @param code Codigo del modulo, ya sin comentarios.
 * @param at Posicion dentro del objeto buscado.
 * @returns El texto del objeto, llaves incluidas.
 */
function enclosingBlock(code: string, at: number): string {
  let start = at;
  let depth = 0;

  while (start > 0) {
    start -= 1;
    if (code[start] === '}') depth += 1;
    else if (code[start] === '{') {
      if (depth === 0) break;
      depth -= 1;
    }
  }

  let end = at;
  depth = 0;

  while (end < code.length) {
    if (code[end] === '{') depth += 1;
    else if (code[end] === '}') {
      if (depth === 0) break;
      depth -= 1;
    }
    end += 1;
  }

  return code.slice(start, end + 1);
}

/** Archivos cuyo codigo, sin comentarios, contiene el patron. Ordenados. */
function filesMatching(pattern: RegExp): string[] {
  return SOURCES.filter((file) => pattern.test(file.code))
    .map((file) => file.path)
    .sort();
}

describe('el censo de fuentes es real', () => {
  it('encuentra los modulos de la capa de diseno', () => {
    // Si el recorrido se rompiera, todos los tests de abajo pasarian vacios.
    expect(SOURCES.length).toBeGreaterThan(80);
    expect(SOURCES.map((file) => file.path)).toContain('src/design/tokens.ts');
  });
});

describe('regla de tamano de §12.9 — el carmin de marca no rellena elementos pequenos', () => {
  it('solo lo consumen los modulos de superficie grande', () => {
    // `\w*` para alcanzar tambien `carmineLit` y `carmineDeep`, que son el mismo
    // relleno en otra densidad. No alcanza `onCarmine`, que es tinta, no relleno.
    expect(filesMatching(/\bbrand\.carmine\w*/).sort()).toEqual([...BRAND_FILL_ALLOWED].sort());
  });

  it('donde tine, no rellena', () => {
    // La mitad geometrica de §12.9 que si se puede comprobar: los dos modulos que
    // usan el carmin como TINTE —la etiqueta del boton invertido y la pestana
    // activa— no pueden ademas rellenar con el.
    const tintOnly = ['src/components/ActionButton.tsx', 'src/components/TabBarItem.tsx'];
    const offenders = SOURCES.filter(
      (file) => tintOnly.includes(file.path) && /backgroundColor:\s*brand\.carmine/.test(file.code),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });

  it('`brand.edge` solo se usa como borde, nunca como relleno', () => {
    expect(filesMatching(/backgroundColor:\s*brand\.edge/)).toEqual([]);
  });

  it('la superficie de subtarjeta solo la consume el bento', () => {
    // Se mira la IMPORTACION y no el uso: `BentoTile` devuelve el objeto entero
    // sin acceder a ningun campo, asi que un patron `tinted.algo` no lo veria, y
    // un `\btinted\b` a secas chocaria con el literal del tipo `BentoTone`.
    const imports = /import\s*\{[^}]*\btinted\b[^}]*\}\s*from\s*'@\/design\/tokens'/;
    expect(filesMatching(imports).sort()).toEqual([...TINTED_ALLOWED].sort());
  });
});

describe('regla de tamano de §12.9 — la alarma no es un fondo grande', () => {
  it('solo la consumen los modulos de la lista blanca', () => {
    expect(filesMatching(/\bsemantic\.\w+/).sort()).toEqual([...SEMANTIC_ALLOWED].sort());
  });

  it('si rellena un fondo, ese fondo declara una medida acotada', () => {
    // ESTO ES LO QUE UN TEST ESTATICO PUEDE COMPROBAR de la mitad «nunca como
    // fondo grande». No sabe cuantos puntos mide nada, pero si puede exigir que
    // el estilo que pinta la alarma declare a la vez un ancho o un alto sacado de
    // `size`, o sea que su tamano este acotado y a la vista.
    //
    // `Notice` cumple: su barra lateral es `width: size.frameBorder`, tres
    // puntos, con titulo y accion al lado. Un `backgroundColor: semantic.*` en un
    // estilo sin medida es un contenedor que se estira, y ahi la regla salta.
    const offenders: string[] = [];

    for (const file of SOURCES) {
      for (const match of file.code.matchAll(/backgroundColor:\s*semantic\.\w+/g)) {
        const block = enclosingBlock(file.code, match.index);
        if (!/\b(width|height):\s*size\./.test(block)) {
          offenders.push(`${file.path}: ${block.replace(/\s+/g, ' ').trim()}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});

describe('la atmosfera no sale del lienzo', () => {
  it('`aurora.*` solo lo consumen los tokens y la propia capa 1', () => {
    expect(filesMatching(/\baurora\.\w+/).sort()).toEqual([...AURORA_ALLOWED].sort());
  });
});

describe('§2 — un literal de color fuera de los tokens es un bug', () => {
  it('ningun modulo escribe un hex suelto', () => {
    const offenders = filesMatching(/#[0-9a-fA-F]{3,8}\b/).filter(
      (path) => !HEX_ALLOWED.includes(path),
    );
    expect(offenders).toEqual([]);
  });

  it('el hueso no es blanco puro y la ciruela no es negro puro', () => {
    // Un blanco o un negro puros no existen en ningun papel y delatan una
    // pantalla. Se comprueba tambien en los dos temas, no solo en la identidad.
    const pure = ['#FFFFFF', '#FFF', '#000000', '#000'];
    const values = [
      identity.bone,
      identity.plum,
      identity.carmine,
      paperLight.canvas,
      paperLight.surface,
      paperLight.ink,
      paperDark.canvas,
      paperDark.surface,
      paperDark.ink,
    ];
    for (const value of values) {
      expect(pure).not.toContain(value.toUpperCase());
    }
  });
});

describe('la configuracion nativa no se desincroniza de la paleta', () => {
  it('el splash y el icono adaptativo usan hueso y ciruela', () => {
    // `app.config.ts` no puede importar tokens.ts: el cargador de Expo lo
    // transpila a CommonJS y no resuelve modulos .ts propios. Este test es lo que
    // sustituye al import, y hace falta porque el primer fotograma del sistema y
    // el primer fotograma de React tienen que ser del mismo color.
    const config = stripComments(readFileSync(join(process.cwd(), 'app.config.ts'), 'utf8'));

    expect(config).toContain(`const BONE = '${identity.bone}'`);
    expect(config).toContain(`const PLUM = '${identity.plum}'`);
    // Y que no haya quedado otro hex suelto, como el #E6F4FE de plantilla que
    // pintaba el fondo del icono de azul claro.
    const strays = [...config.matchAll(/'#[0-9a-fA-F]{3,8}'/g)].map((match) => match[0]);
    expect(strays).toEqual([`'${identity.bone}'`, `'${identity.plum}'`]);
  });
});

describe('§12.1 — una cifra clinica no se apoya en vidrio', () => {
  it('`type.vital` y `GlassCard` no coexisten en un archivo', () => {
    const offenders = SOURCES.filter(
      (file) => /\btype\.vital\b/.test(file.code) && /\bGlassCard\b/.test(file.code),
    );
    expect(offenders.map((file) => file.path)).toEqual([]);
  });
});

describe('las tres familias tipograficas se ganan el sitio', () => {
  it('cada rol de `type` se usa en algun modulo', () => {
    // Medido en D.1: `type.vital` no aparecia en ninguna de las doce pantallas y
    // `type.display` solo en el splash. Una fuente que nadie usa son kilobytes
    // en el paquete a cambio de nada, asi que el test lo vigila.
    const roles = ['display', 'h1', 'body', 'caption', 'eyebrow', 'vital', 'data'];
    const unused = roles.filter(
      (role) => filesMatching(new RegExp(`type\\.${role}\\b`)).length === 0,
    );
    expect(unused).toEqual([]);
  });
});

describe('la marca y la alarma no pueden ser el mismo color', () => {
  it('ningun valor de `brand` coincide con uno de `semantic`', () => {
    // Si el carmin de marca acabara siendo el mismo hex que una alarma, la regla
    // de tamano dejaria de tener con que distinguirlas.
    const alarms: readonly string[] = Object.values(semantic);
    expect(alarms).not.toContain(brand.carmine);
    expect(alarms).not.toContain(brand.edge);
  });
});
