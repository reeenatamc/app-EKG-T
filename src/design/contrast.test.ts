import {
  composite,
  contrastRatio,
  parseHex,
  relativeLuminance,
  round,
  type Rgb,
} from '@/design/contrast';
import {
  aurora,
  auroraOpacity,
  brand,
  findingMeter,
  frost,
  glass,
  hero,
  paperDark,
  paperLight,
  resultCard,
  semantic,
} from '@/design/tokens';

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
    ['claro: texto alto sobre superficie', paperLight.textHigh, paperLight.surface, 17.4],
    ['claro: texto bajo sobre superficie', paperLight.textLow, paperLight.surface, 6.73],
    ['claro: trazado sobre superficie', paperLight.ink, paperLight.surface, 18.66],
    ['oscuro: texto alto sobre lienzo', paperDark.textHigh, paperDark.canvas, 16.04],
    ['oscuro: texto bajo sobre lienzo', paperDark.textLow, paperDark.canvas, 8.09],
    ['oscuro: texto alto sobre superficie', paperDark.textHigh, paperDark.surface, 12.59],
    ['oscuro: texto bajo sobre superficie', paperDark.textLow, paperDark.surface, 6.35],
    ['oscuro: trazado sobre superficie', paperDark.ink, paperDark.surface, 12.59],
    ['etiqueta sobre carmin (boton primario)', brand.onCarmine, brand.carmine, 7.48],
    ['carmin sobre hueso (boton invertido)', brand.carmine, paperLight.surface, 7.83],
  ];

  it.each(pairs)('%s mide %f:1', (_label, foreground, background, expected) => {
    const measured = round(contrastRatio(foreground, background));
    expect(measured).toBe(expected);
    expect(measured).toBeGreaterThanOrEqual(WCAG_TEXT_FLOOR);
  });
});

describe('vidrio, medido sobre el compuesto y no sobre el token', () => {
  it('el texto claro aguanta el peor fondo posible bajo el vidrio', () => {
    expect(round(contrastRatio(paperLight.textHigh, GLASS_LIGHT))).toBe(5.74);
  });

  it('el texto oscuro aguanta el peor fondo posible bajo el vidrio', () => {
    expect(round(contrastRatio(paperDark.textHigh, GLASS_DARK))).toBe(4.84);
  });

  it('con el tinte anterior el vidrio incumplia, que es por lo que subio', () => {
    // La cifra que justifica la enmienda de §3. No es historia: si alguien baja
    // el tinte «porque se ve mas el desenfoque», esto dice cuanto cuesta.
    const before = composite(paperLight.surface, 0.42, paperLight.ink);
    expect(round(contrastRatio(paperLight.textHigh, before))).toBe(3.79);
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
    expect(round(contrastRatio(paperLight.edge, paperLight.surface))).toBe(1.9);
    expect(round(contrastRatio(paperDark.edge, paperDark.surface))).toBe(1.84);
  });

  it('el lienzo y la superficie ya no son el mismo color', () => {
    expect(round(contrastRatio(paperLight.canvas, paperLight.surface))).toBe(1.3);
    expect(round(contrastRatio(paperDark.canvas, paperDark.surface))).toBe(1.27);
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

describe('texto sobre escarcha, en el peor fondo de la atmosfera suave', () => {
  // Bajo una tarjeta escarchada no pasa contenido: pasa la atmosfera. El peor caso
  // es el centro del blob mas contrario a la tinta del tema, a la opacidad del
  // tema: ciruela en claro, bruma en oscuro. Ver D-25.
  const toHex = ({ r, g, b }: Rgb): string =>
    `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;

  const lightCard = composite(
    paperLight.surface,
    tintAlpha(frost.light.fill),
    toHex(composite(aurora.plum, auroraOpacity.light, paperLight.canvasFlat)),
  );
  const darkCard = composite(
    paperDark.surface,
    tintAlpha(frost.dark.fill),
    toHex(composite(aurora.haze, auroraOpacity.dark, paperDark.canvasFlat)),
  );

  it('el relleno es la superficie del tema con alfa, no otro color', () => {
    for (const [fill, surface] of [
      [frost.light.fill, paperLight.surface],
      [frost.dark.fill, paperDark.surface],
    ] as const) {
      const { r, g, b } = parseHex(surface);
      expect(fill.startsWith(`rgba(${r}, ${g}, ${b},`)).toBe(true);
    }
  });

  it.each([
    ['claro: texto alto', paperLight.textHigh, lightCard, 15.53],
    ['claro: texto bajo', paperLight.textLow, lightCard, 6.01],
    ['oscuro: texto alto', paperDark.textHigh, darkCard, 9.6],
    ['oscuro: texto bajo', paperDark.textLow, darkCard, 4.84],
  ] as const)('%s mide %f:1', (_label, ink, card, expected) => {
    expect(round(contrastRatio(ink, card))).toBe(expected);
    expect(contrastRatio(ink, card)).toBeGreaterThanOrEqual(WCAG_TEXT_FLOOR);
  });
});

describe('texto de la tarjeta del hallazgo principal, en ciruela', () => {
  // Superficie opaca, sin degradado: el peor caso de cada tema es la propia
  // superficie y, para la etiqueta de categoria, la pastilla translucida encima.
  // Ver D-30.
  const onTag = (surface: string): Rgb =>
    composite(paperDark.textHigh, tintAlpha(resultCard.tag), surface);

  it('la pastilla y la pista son la tinta clara del tema oscuro con alfa', () => {
    const { r, g, b } = parseHex(paperDark.textHigh);
    expect(resultCard.tag.startsWith(`rgba(${r}, ${g}, ${b},`)).toBe(true);
    expect(resultCard.track.startsWith(`rgba(${r}, ${g}, ${b},`)).toBe(true);
  });

  it('el resultado no se pinta con ningun rojo de la marca', () => {
    const reds = [brand.carmine, brand.edge, hero.light.focus, hero.light.edge, hero.dark.focus];
    expect(reds).not.toContain(resultCard.light.surface);
    expect(reds).not.toContain(resultCard.dark.surface);
  });

  it.each([
    ['claro: hueso sobre ciruela', resultCard.ink, resultCard.light.surface, 13.88],
    ['claro: texto bajo sobre ciruela', resultCard.inkLow, resultCard.light.surface, 7.97],
    ['claro: hueso sobre la etiqueta', resultCard.ink, onTag(resultCard.light.surface), 9.25],
    ['oscuro: hueso sobre ciruela', resultCard.ink, resultCard.dark.surface, 12],
    ['oscuro: texto bajo sobre ciruela', resultCard.inkLow, resultCard.dark.surface, 6.89],
    ['oscuro: hueso sobre la etiqueta', resultCard.ink, onTag(resultCard.dark.surface), 8.06],
  ] as const)('%s mide %f:1', (_label, ink, surface, expected) => {
    expect(round(contrastRatio(ink, surface))).toBe(expected);
    expect(contrastRatio(ink, surface)).toBeGreaterThanOrEqual(WCAG_TEXT_FLOOR);
  });

  it('en oscuro la tarjeta se separa del lienzo y de las demas tarjetas', () => {
    // Si se quedara en `paperDark.surface` seria una tarjeta mas (1:1).
    expect(round(contrastRatio(resultCard.dark.surface, paperDark.canvas))).toBe(1.47);
    expect(round(contrastRatio(resultCard.dark.surface, paperDark.surface))).toBe(1.16);
  });
});

describe('barra fina de confianza en la lista de hallazgos', () => {
  it.each([
    ['claro', findingMeter.light, paperLight.surface, 3.97],
    ['oscuro', findingMeter.dark, paperDark.surface, 4.49],
  ] as const)('%s: se distingue de la superficie, %f:1', (_label, meter, surface, expected) => {
    expect(round(contrastRatio(meter, surface))).toBe(expected);
    expect(contrastRatio(meter, surface)).toBeGreaterThanOrEqual(WCAG_BOUNDARY_FLOOR);
  });
});

describe('texto de la tarjeta principal sobre su degradado', () => {
  // El peor caso es el foco con el brillo encima: ahi la superficie esta mas clara.
  // En la esquina contraria no llega el brillo. Ver D-28.
  const toHex = ({ r, g, b }: Rgb): string =>
    `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`;
  const lit = (focus: string): Rgb => composite(paperLight.surface, tintAlpha(hero.sheen), focus);

  it('el brillo es la superficie clara con alfa, no otro color', () => {
    const { r, g, b } = parseHex(paperLight.surface);
    expect(hero.sheen.startsWith(`rgba(${r}, ${g}, ${b},`)).toBe(true);
  });

  it.each([
    ['claro: foco con brillo', toHex(lit(hero.light.focus)), 5.2],
    ['claro: esquina en sombra', hero.light.edge, 10.23],
    ['oscuro: foco con brillo', toHex(lit(hero.dark.focus)), 9.12],
    ['oscuro: esquina en sombra', hero.dark.edge, 16.81],
  ] as const)('hueso sobre %s mide %f:1', (_label, surface, expected) => {
    expect(round(contrastRatio(brand.onCarmine, surface))).toBe(expected);
    expect(contrastRatio(brand.onCarmine, surface)).toBeGreaterThanOrEqual(WCAG_TEXT_FLOOR);
  });
});
