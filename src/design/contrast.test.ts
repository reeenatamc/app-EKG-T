import { composite, contrastRatio, parseHex, relativeLuminance, round } from '@/design/contrast';
import { brand, glass, paperDark, paperLight, semantic, tinted } from '@/design/tokens';

/**
 * Los pares de contraste de la paleta, medidos y fijados.
 *
 * POR QUE LOS VALORES EXACTOS Y NO SOLO EL UMBRAL. Fijar solo «>= 4.5» deja
 * pasar una deriva silenciosa: alguien aclara un texto, sigue cumpliendo el
 * suelo, y la tabla del README pasa a mentir. Con el valor exacto, cambiar un
 * token obliga a mirar el numero nuevo y a copiarlo al README. La prueba y la
 * documentacion no se pueden desincronizar.
 *
 * Los pares de vidrio se miden sobre el COMPUESTO. El peor caso cambio con el
 * rediseno: desde que el objetivo de desenfoque incluye el contenido que se
 * desplaza, lo que puede pasar por debajo del vidrio no es la malla del fondo,
 * es un bloque de tinta a ancho completo.
 */

/** Opacidad del tinte, leida de la propia cadena rgba para no duplicarla. */
function tintAlpha(rgba: string): number {
  const alpha = /,\s*([\d.]+)\)\s*$/.exec(rgba)?.[1];

  if (alpha === undefined) {
    throw new Error(`No se pudo leer la opacidad de "${rgba}".`);
  }

  return Number.parseFloat(alpha);
}

const WCAG_TEXT_FLOOR = 4.5;
const WCAG_BOUNDARY_FLOOR = 3;

// Peor caso de vidrio: el tinte del tema sobre la tinta del tema, que es la
// superficie mas contraria que el contenido puede meter por debajo.
const GLASS_LIGHT = composite(paperLight.surface, tintAlpha(glass.tintLight), paperLight.ink);
const GLASS_DARK = composite(paperDark.surface, tintAlpha(glass.tintDark), paperDark.ink);

/** Nombre legible, color de encima, color de debajo, razon medida. */
type Pair = readonly [string, string, string, number];

describe('texto y trazado, suelo de 4.5:1 de §7', () => {
  const pairs: readonly Pair[] = [
    ['claro: texto alto sobre lienzo', paperLight.textHigh, paperLight.canvas, 13.42],
    ['claro: texto bajo sobre lienzo', paperLight.textLow, paperLight.canvas, 5.19],
    ['claro: texto alto sobre superficie', paperLight.textHigh, paperLight.surface, 16.61],
    ['claro: texto bajo sobre superficie', paperLight.textLow, paperLight.surface, 6.42],
    ['claro: trazado sobre superficie', paperLight.ink, paperLight.surface, 17.82],
    ['oscuro: texto alto sobre lienzo', paperDark.textHigh, paperDark.canvas, 16.04],
    ['oscuro: texto bajo sobre lienzo', paperDark.textLow, paperDark.canvas, 8.09],
    ['oscuro: texto alto sobre superficie', paperDark.textHigh, paperDark.surface, 12.59],
    ['oscuro: texto bajo sobre superficie', paperDark.textLow, paperDark.surface, 6.35],
    ['oscuro: trazado sobre superficie', paperDark.ink, paperDark.surface, 12.59],
    ['etiqueta sobre carmin (boton primario)', brand.onCarmine, brand.carmine, 7.48],
    ['apoyo sobre carmin (modulo hero)', brand.onCarmineLow, brand.carmine, 5.68],
    ['carmin sobre hueso (boton invertido)', brand.carmine, paperLight.surface, 7.48],
    // Los dos extremos del degradado del hero. El peor caso es el FOCO, no el
    // borde: el degradado oscurece hacia fuera a proposito, asi que hacia el
    // borde el contraste solo puede mejorar.
    ['etiqueta sobre el foco del degradado', brand.onCarmine, brand.carmineLit, 6.15],
    ['etiqueta sobre el extremo del degradado', brand.onCarmine, brand.carmineDeep, 10.23],
    ['apoyo sobre el foco del degradado', brand.onCarmineLow, brand.carmineLit, 4.67],
    ['apoyo sobre el extremo del degradado', brand.onCarmineLow, brand.carmineDeep, 7.77],
    // La subtarjeta del bento. Aqui el peor caso es el BORDE, al reves que en el
    // hero: el vino se carga hacia fuera. Ver D-23.
    ['titulo sobre el nucleo de la subtarjeta', tinted.title, tinted.focus, 12.59],
    ['titulo sobre el borde de la subtarjeta', tinted.title, tinted.edge, 9.67],
    ['apoyo sobre el nucleo de la subtarjeta', tinted.body, tinted.focus, 9.93],
    ['apoyo sobre el borde de la subtarjeta', tinted.body, tinted.edge, 7.62],
  ];

  it.each(pairs)('%s mide %f:1', (_label, foreground, background, expected) => {
    const measured = round(contrastRatio(foreground, background));
    expect(measured).toBe(expected);
    expect(measured).toBeGreaterThanOrEqual(WCAG_TEXT_FLOOR);
  });
});

describe('vidrio, medido sobre el compuesto y no sobre el token', () => {
  it('el texto claro aguanta el peor fondo posible bajo el vidrio', () => {
    expect(round(contrastRatio(paperLight.textHigh, GLASS_LIGHT))).toBe(5.53);
  });

  it('el texto oscuro aguanta el peor fondo posible bajo el vidrio', () => {
    expect(round(contrastRatio(paperDark.textHigh, GLASS_DARK))).toBe(4.84);
  });

  it('con el tinte anterior el vidrio incumplia, que es por lo que subio', () => {
    // La cifra que justifica la enmienda de §3. No es historia: si alguien baja
    // el tinte «porque se ve mas el desenfoque», esto dice cuanto cuesta.
    const before = composite(paperLight.surface, 0.42, paperLight.ink);
    expect(round(contrastRatio(paperLight.textHigh, before))).toBe(3.67);
    expect(contrastRatio(paperLight.textHigh, before)).toBeLessThan(WCAG_TEXT_FLOOR);
  });
});

describe('contornos de control, suelo de 3:1 de la WCAG 1.4.11', () => {
  it('el filo del carmin se distingue del lienzo en los dos temas', () => {
    expect(round(contrastRatio(brand.edge, paperLight.canvas))).toBe(3.59);
    expect(round(contrastRatio(brand.edge, paperDark.canvas))).toBe(3.97);
    expect(contrastRatio(brand.edge, paperLight.canvas)).toBeGreaterThanOrEqual(
      WCAG_BOUNDARY_FLOOR,
    );
    expect(contrastRatio(brand.edge, paperDark.canvas)).toBeGreaterThanOrEqual(WCAG_BOUNDARY_FLOOR);
  });
});

describe('una tarjeta tiene filo propio', () => {
  it('el filo se separa de la superficie en los dos temas', () => {
    // El par superficie/lienzo era 1.04:1 antes del rediseno, o sea invisible:
    // la forma de la tarjeta la dibujaba el aurora que tenia detras.
    expect(round(contrastRatio(paperLight.edge, paperLight.surface))).toBe(1.82);
    expect(round(contrastRatio(paperDark.edge, paperDark.surface))).toBe(1.84);
  });

  it('el lienzo y la superficie ya no son el mismo color', () => {
    expect(round(contrastRatio(paperLight.canvas, paperLight.surface))).toBe(1.24);
    expect(round(contrastRatio(paperDark.canvas, paperDark.surface))).toBe(1.27);
  });

  it('la subtarjeta se ve como objeto en los dos lienzos', () => {
    // El motivo de D-23. El tinte rosa anterior media 1.91:1 contra el hueso, o
    // sea que la tarjeta apenas existia y toda la separacion la hacia la sombra.
    expect(round(contrastRatio(tinted.edge, paperLight.canvasFlat))).toBe(10.66);
    expect(round(contrastRatio(tinted.edge, paperDark.canvasFlat))).toBe(1.66);
  });

  it('el hero y la subtarjeta NO se separan por luminancia', () => {
    // El coste de D-23, fijado para que no se olvide: en luminancia los dos
    // bordes son el mismo bloque oscuro. Lo que los separa es la saturacion y el
    // tamano, no la claridad.
    expect(round(contrastRatio(brand.carmineDeep, tinted.edge))).toBe(1.04);
  });
});

describe('la marca no se confunde con una alarma', () => {
  it('el carmin es mucho mas oscuro que la alarma alta', () => {
    // Era 1.70:1 con `aurora.rose`, o sea que solo la saturacion del tono
    // separaba «boton de marca» de «alarma critica». La diferencia de luminancia
    // es la mitad del argumento; la otra mitad es la regla de tamano de §12.9.
    expect(round(contrastRatio(brand.carmine, semantic.alarmHigh))).toBe(2.14);
    expect(relativeLuminance(brand.carmine)).toBeLessThan(
      relativeLuminance(semantic.alarmHigh) / 2,
    );
  });
});

describe('la aritmetica de la medicion', () => {
  it('parseHex rechaza lo que no es un hex de seis digitos', () => {
    expect(() => parseHex('#FFF')).toThrow();
    expect(parseHex('#9E1B32')).toEqual({ r: 158, g: 27, b: 50 });
  });

  it('el blanco y el negro puros dan el maximo de la escala', () => {
    expect(round(contrastRatio('#FFFFFF', '#000000'))).toBe(21);
  });

  it('componer con alfa 1 devuelve el color de encima', () => {
    expect(composite('#9E1B32', 1, '#FCF8F4')).toEqual({ r: 158, g: 27, b: 50 });
  });
});
