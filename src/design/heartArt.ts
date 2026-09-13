import {
  BEAT_BASELINE,
  BEAT_VIEWBOX,
  beatSvg,
  lengthFractions,
  shiftBeat,
} from '@/design/beatPoints';
import { brand, heart } from '@/design/tokens';

/**
 * El corazon del arranque y del icono, como datos. Ver D-27.
 *
 * SIN SKIA Y SIN REACT. Lo dibujan dos cosas: `SplashHeart` en la aplicacion y
 * `scripts/render-brand-art.mjs` en Node, que genera los iconos y las vistas
 * previas. Si la geometria o los colores vivieran en cada uno, el icono y el
 * arranque acabarian siendo dos corazones distintos.
 *
 * Todo esta en el sistema de un cuadrado de 1000 unidades.
 */

export const HEART_BOX = 1000;

/**
 * Silueta estilizada: dos lobulos amplios y una punta fina. No es anatomica.
 * Simetrica respecto de x = 500, que es lo que permite el giro en Y.
 */
export const HEART_SVG =
  'M500,884 C462,850 128,664 110,410 C98,236 212,126 346,126 ' +
  'C422,126 476,172 500,238 C524,172 578,126 654,126 ' +
  'C788,126 902,236 890,410 C872,664 538,850 500,884 Z';

/** Punto sobre el que late y gira el corazon. La linea de base pasa por aqui. */
export const HEART_PIVOT = { x: 500, y: 530 } as const;

export interface Glow {
  readonly cx: number;
  readonly cy: number;
  readonly r: number;
  /** Achatamiento vertical: 1 es un circulo. */
  readonly squash: number;
  /** Giro en radianes del ovalo resultante. */
  readonly angle: number;
  readonly colors: readonly string[];
  readonly positions: readonly number[];
}

/** Relleno principal: luz arriba a la izquierda, carmin, y sombra propia. */
export const HEART_BODY = {
  cx: 350,
  cy: 290,
  r: 800,
  colors: [heart.lit, brand.carmine, heart.shade, heart.core],
  positions: [0, 0.36, 0.78, 1],
} as const;

/** Luz rebotada abajo a la derecha: separa el borde en sombra del fondo. */
export const HEART_BOUNCE: Glow = {
  cx: 740,
  cy: 740,
  r: 380,
  squash: 0.42,
  angle: -0.85,
  colors: [heart.bounce, heart.bounceClear],
  positions: [0, 1],
};

/** Brillo ancho sobre el lobulo izquierdo. */
export const HEART_SHEEN: Glow = {
  cx: 320,
  cy: 300,
  r: 170,
  squash: 0.45,
  angle: -0.75,
  colors: [heart.sheen, heart.sheenClear],
  positions: [0, 1],
};

/** Reflejo especular: pequeno y nitido. */
export const HEART_SPARK: Glow = {
  cx: 290,
  cy: 262,
  r: 52,
  squash: 0.5,
  angle: -0.75,
  colors: [heart.spark, heart.spark, heart.sparkClear],
  positions: [0, 0.3, 1],
};

/** Cuanto se desplazan los brillos durante el giro, en unidades del corazon. */
export const HEART_GLINT_DRIFT = 140;

/**
 * Sombra de contacto y halo, por tema.
 *
 * En claro la sombra es ciruela. En oscuro una sombra ciruela sobre ciruela no
 * existe, asi que el suelo recibe luz carmin: el corazon ilumina en vez de
 * tapar.
 */
export function heartAmbient(isDark: boolean): { shadow: Glow; glow: Glow } {
  return {
    shadow: {
      cx: 500,
      cy: 968,
      r: 340,
      squash: 0.13,
      angle: 0,
      colors: isDark
        ? [heart.shadowDark, heart.shadowDarkClear]
        : [heart.shadowLight, heart.shadowLightClear],
      positions: [0, 1],
    },
    glow: {
      cx: 500,
      cy: 500,
      r: 660,
      squash: 1,
      angle: 0,
      colors: isDark
        ? [heart.glowDark, heart.glowDarkClear]
        : [heart.glowLight, heart.glowLightClear],
      positions: [0, 1],
    },
  };
}

/** Grosor del contorno de la onda expansiva, en unidades del corazon. */
export const HEART_RIPPLE_WIDTH = 10;

/** Color del trazo dentro del corazon: la tinta sobre carmin. */
export const HEART_TRACE_INK = brand.onCarmine;

/**
 * El latido centrado: el QRS cae en el centro de la pantalla, dentro del
 * corazon. Desplazado 275 unidades, que llevan el centro del QRS de 325 a 600.
 */
const CENTERED_BEAT = shiftBeat(BEAT_VIEWBOX.width / 2 - 325);

export const HEART_TRACE_SVG = beatSvg(CENTERED_BEAT);

const FRACTIONS = lengthFractions(CENTERED_BEAT);

/** Fraccion del trazo en el fondo de la S, el centro del QRS. */
export const TRACE_QRS_FRACTION = FRACTIONS[7] ?? 0.5;

/** Fraccion del trazo al terminar la onda T. */
export const TRACE_T_END_FRACTION = FRACTIONS[12] ?? 0.7;

/** Grosor del trazo en puntos de pantalla, igual que el latido anterior. */
export const TRACE_STROKE = 6;

/** Resplandor del trazo dentro del corazon. Solo decorativo: ver §13. */
export const TRACE_GLOW = 5;

/** Proporciones de la escena respecto del ancho disponible. */
const SCENE = { widthRatio: 0.56, maxHeart: 280, heightRatio: 1.42, lift: 0.03 } as const;

export interface HeartSceneLayout {
  readonly width: number;
  readonly height: number;
  /** Del sistema del corazon a la pantalla. */
  readonly figure: { readonly left: number; readonly top: number; readonly scale: number };
  /** Del sistema del latido a la pantalla. */
  readonly trace: { readonly translateY: number; readonly scale: number };
  /** Del sistema del latido al del corazon, para el trazo recortado. */
  readonly innerTrace: { readonly x: number; readonly y: number; readonly scale: number };
}

/**
 * Donde va cada cosa para un ancho dado. Se calcula al cambiar el tamano, nunca
 * por fotograma.
 *
 * @param width Ancho disponible en puntos.
 * @returns Las medidas de la escena.
 */
export function heartSceneLayout(width: number): HeartSceneLayout {
  const size = Math.min(width * SCENE.widthRatio, SCENE.maxHeart);
  const height = Math.ceil(size * SCENE.heightRatio);
  const scale = size / HEART_BOX;
  const left = (width - size) / 2;
  const top = (height - size) / 2 - size * SCENE.lift;
  const traceScale = width / BEAT_VIEWBOX.width;
  const translateY = top + HEART_PIVOT.y * scale - BEAT_BASELINE * traceScale;

  return {
    width,
    height,
    figure: { left, top, scale },
    trace: { translateY, scale: traceScale },
    innerTrace: { x: -left / scale, y: (translateY - top) / scale, scale: traceScale / scale },
  };
}
