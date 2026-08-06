/**
 * Medicion de contraste segun la WCAG.
 *
 * Vive en el codigo, y no en una hoja aparte, porque el suelo de 4.5:1 de §7 es
 * un guardarrail clinico: si un token cambia, lo que tiene que enterarse es la
 * suite de pruebas, no yo releyendo un README de hace tres semanas.
 *
 * Los pares de vidrio se miden SOBRE EL COMPUESTO, nunca sobre el token: el
 * vidrio no es su tinte, es su tinte por lo que tenga detras.
 */

const SRGB_MAX = 255;
const LINEAR_THRESHOLD = 0.04045;
const LINEAR_DIVISOR = 12.92;
const GAMMA_OFFSET = 0.055;
const GAMMA_SCALE = 1.055;
const GAMMA_EXPONENT = 2.4;
const LUMA = { r: 0.2126, g: 0.7152, b: 0.0722 } as const;
const RATIO_OFFSET = 0.05;

export interface Rgb {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

/**
 * Convierte un hex de seis digitos en canales de 0 a 255.
 *
 * @param hex Color en formato `#RRGGBB`.
 * @returns Los tres canales.
 * @throws {Error} Si el formato no es un hex de seis digitos.
 */
export function parseHex(hex: string): Rgb {
  const digits = /^#([0-9a-fA-F]{6})$/.exec(hex)?.[1];

  if (digits === undefined) {
    throw new Error(`parseHex espera #RRGGBB y recibio "${hex}".`);
  }

  const BYTE = 256;
  const value = Number.parseInt(digits, 16);
  // Aritmetica en lugar de desplazamientos de bits: la regla no-bitwise del
  // proyecto existe porque un `&` donde iba un `&&` es un bug silencioso.
  return {
    r: Math.floor(value / (BYTE * BYTE)),
    g: Math.floor(value / BYTE) % BYTE,
    b: value % BYTE,
  };
}

/** Linealiza un canal, que es lo que la formula de la WCAG exige antes de pesar. */
function linearize(channel: number): number {
  const normalized = channel / SRGB_MAX;

  if (normalized <= LINEAR_THRESHOLD) {
    return normalized / LINEAR_DIVISOR;
  }

  return Math.pow((normalized + GAMMA_OFFSET) / GAMMA_SCALE, GAMMA_EXPONENT);
}

/**
 * Luminancia relativa de un color.
 *
 * @param color Color en hex o en canales.
 * @returns La luminancia, entre 0 y 1.
 */
export function relativeLuminance(color: string | Rgb): number {
  const { r, g, b } = typeof color === 'string' ? parseHex(color) : color;
  return LUMA.r * linearize(r) + LUMA.g * linearize(g) + LUMA.b * linearize(b);
}

/**
 * Razon de contraste entre dos colores.
 *
 * @param a Primer color.
 * @param b Segundo color.
 * @returns La razon, siempre mayor o igual que 1.
 */
export function contrastRatio(a: string | Rgb, b: string | Rgb): number {
  const first = relativeLuminance(a);
  const second = relativeLuminance(b);
  const high = Math.max(first, second);
  const low = Math.min(first, second);

  return (high + RATIO_OFFSET) / (low + RATIO_OFFSET);
}

/**
 * Compone un color con alfa sobre un fondo opaco.
 *
 * La mezcla se hace en espacio gamma —sobre los canales tal cual— porque es lo
 * que hace el compositor de la plataforma. Mezclar en lineal daria un numero mas
 * bonito y menos parecido a lo que se ve en el telefono.
 *
 * @param foreground Color de encima, en hex.
 * @param alpha Opacidad del color de encima, entre 0 y 1.
 * @param background Color de debajo, en hex.
 * @returns El color resultante.
 */
export function composite(foreground: string, alpha: number, background: string): Rgb {
  const top = parseHex(foreground);
  const bottom = parseHex(background);

  return {
    r: alpha * top.r + (1 - alpha) * bottom.r,
    g: alpha * top.g + (1 - alpha) * bottom.g,
    b: alpha * top.b + (1 - alpha) * bottom.b,
  };
}

/**
 * Redondea a dos decimales, que es la precision con la que se documenta.
 *
 * @param ratio Razon de contraste.
 * @returns La razon redondeada.
 */
export function round(ratio: number): number {
  const HUNDRED = 100;
  return Math.round(ratio * HUNDRED) / HUNDRED;
}
