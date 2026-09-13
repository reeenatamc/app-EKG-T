import {
  BlurMask,
  Canvas,
  Circle,
  Group,
  Path,
  RadialGradient,
  Skia,
  type SkPath,
} from '@shopify/react-native-skia';
import { useMemo, type ReactNode } from 'react';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

import {
  HEART_BODY,
  HEART_BOUNCE,
  HEART_GLINT_DRIFT,
  HEART_PIVOT,
  HEART_RIPPLE_WIDTH,
  HEART_SHEEN,
  HEART_SPARK,
  HEART_SVG,
  HEART_TRACE_INK,
  HEART_TRACE_SVG,
  TRACE_GLOW,
  TRACE_STROKE,
  heartAmbient,
  heartSceneLayout,
  type Glow,
  type HeartSceneLayout,
} from '@/design/heartArt';
import {
  beatScale,
  glintShift,
  glowOpacity,
  ripple,
  shadowOpacity,
  shadowScaleX,
  traceEnd,
  turnScaleX,
} from '@/design/heartTimeline';
import { useBeatProgress } from '@/design/useBeatProgress';

/**
 * Construidos una sola vez, a nivel de modulo. Ningun path se rehace por
 * fotograma: lo que se anima son transformaciones, opacidades, el centro de un
 * degradado y el recorte `end` del trazo (§13).
 */
const HEART_PATH = Skia.Path.MakeFromSVGString(HEART_SVG);
const TRACE_PATH = Skia.Path.MakeFromSVGString(HEART_TRACE_SVG);

const PIVOT = { x: HEART_PIVOT.x, y: HEART_PIVOT.y };
const ORIGIN = { x: 0, y: 0 };
const BODY_COLORS = [...HEART_BODY.colors];
const BODY_POSITIONS = [...HEART_BODY.positions];

type Clock = SharedValue<number>;

/**
 * Alto que necesita la escena para un ancho dado: sombra, halo y onda incluidos.
 *
 * @param width Ancho disponible en puntos.
 * @returns El alto que hay que reservarle.
 */
export function heartSceneHeightFor(width: number): number {
  return heartSceneLayout(width).height;
}

interface SplashHeartProps {
  /** Duracion del guion completo. */
  readonly durationMs: number;
  readonly width: number;
  /** En oscuro la sombra de contacto pasa a ser luz carmin sobre el suelo. */
  readonly isDark: boolean;
  /** Trazo fuera del corazon y onda expansiva. Llega del tema, como antes. */
  readonly traceColor: string;
}

/**
 * El corazon del arranque: gira, lo cruza el latido y late dos veces. Ver D-27.
 *
 * UN SOLO LIENZO Y UN SOLO RELOJ. Todas las capas derivan su estado de un valor
 * compartido que va de 0 a 1 en el hilo de UI, con las funciones puras de
 * `heartTimeline.ts`. Con movimiento reducido el reloj arranca en 1, que es el
 * fotograma final en reposo.
 *
 * El volumen es pintura, no geometria: degradados radiales para la luz y la
 * sombra propia, dos brillos recortados a la silueta y una sombra de contacto.
 * Solo el trazo interior lleva desenfoque; todo lo demas son degradados, que no
 * cuestan una pasada extra en un Android de gama baja.
 *
 * @returns El lienzo con la escena, o null si algun path no se pudo construir.
 */
export function SplashHeart({ durationMs, width, isDark, traceColor }: SplashHeartProps) {
  const clock = useBeatProgress(durationMs);
  const layout = useMemo(() => heartSceneLayout(width), [width]);

  if (HEART_PATH === null || TRACE_PATH === null) {
    return null;
  }

  const { figure } = layout;

  return (
    <Canvas
      style={{ width, height: layout.height }}
      pointerEvents="none"
      accessibilityElementsHidden
    >
      <OuterTrace clock={clock} layout={layout} trace={TRACE_PATH} color={traceColor} />
      <Group
        transform={[
          { translateX: figure.left },
          { translateY: figure.top },
          { scale: figure.scale },
        ]}
      >
        <Ambient clock={clock} isDark={isDark} color={traceColor} shape={HEART_PATH} />
        <Beating clock={clock}>
          <Body clock={clock} shape={HEART_PATH} />
          <InnerTrace clock={clock} layout={layout} shape={HEART_PATH} trace={TRACE_PATH} />
        </Beating>
      </Group>
    </Canvas>
  );
}

interface GlowOvalProps {
  readonly spec: Glow;
  readonly dx?: SharedValue<number>;
  readonly scaleX?: SharedValue<number>;
  readonly opacity?: SharedValue<number>;
}

/** Un ovalo difuminado: circulo con degradado, girado y achatado. */
function GlowOval({ spec, dx, scaleX, opacity }: GlowOvalProps) {
  const transform = useDerivedValue(() => [
    { translateX: spec.cx + (dx?.value ?? 0) },
    { translateY: spec.cy },
    { rotate: spec.angle },
    { scaleX: scaleX?.value ?? 1 },
    { scaleY: spec.squash },
  ]);
  const alpha = useDerivedValue(() => opacity?.value ?? 1);

  return (
    <Group transform={transform} opacity={alpha}>
      <Circle cx={0} cy={0} r={spec.r}>
        <RadialGradient
          c={ORIGIN}
          r={spec.r}
          colors={[...spec.colors]}
          positions={[...spec.positions]}
        />
      </Circle>
    </Group>
  );
}

/** El latido que cruza la pantalla, por detras del corazon. */
function OuterTrace(props: {
  clock: Clock;
  layout: HeartSceneLayout;
  trace: SkPath;
  color: string;
}) {
  const { clock, layout, trace, color } = props;
  const end = useDerivedValue(() => traceEnd(clock.value));

  return (
    <Group transform={[{ translateY: layout.trace.translateY }, { scale: layout.trace.scale }]}>
      <Path
        path={trace}
        style="stroke"
        strokeWidth={TRACE_STROKE / layout.trace.scale}
        strokeCap="round"
        strokeJoin="round"
        color={color}
        start={0}
        end={end}
      />
    </Group>
  );
}

/** Sombra de contacto, halo y onda expansiva. No laten con el corazon. */
function Ambient(props: { clock: Clock; isDark: boolean; color: string; shape: SkPath }) {
  const { clock, isDark, color, shape } = props;
  const { shadow, glow } = useMemo(() => heartAmbient(isDark), [isDark]);
  const shadowX = useDerivedValue(() => shadowScaleX(clock.value));
  const shadowAlpha = useDerivedValue(() => shadowOpacity(clock.value));
  const glowAlpha = useDerivedValue(() => glowOpacity(clock.value));

  return (
    <>
      <GlowOval spec={shadow} scaleX={shadowX} opacity={shadowAlpha} />
      <GlowOval spec={glow} opacity={glowAlpha} />
      <Ripple clock={clock} color={color} shape={shape} />
    </>
  );
}

function Ripple({ clock, color, shape }: { clock: Clock; color: string; shape: SkPath }) {
  const transform = useDerivedValue(() => [{ scale: ripple(clock.value).scale }]);
  const opacity = useDerivedValue(() => ripple(clock.value).opacity);

  return (
    <Group origin={PIVOT} transform={transform} opacity={opacity}>
      <Path path={shape} style="stroke" strokeWidth={HEART_RIPPLE_WIDTH} color={color} />
    </Group>
  );
}

/** Escala del latido doble, sobre la linea de base. */
function Beating({ clock, children }: { clock: Clock; children: ReactNode }) {
  const transform = useDerivedValue(() => [{ scale: beatScale(clock.value) }]);

  return (
    <Group origin={PIVOT} transform={transform}>
      {children}
    </Group>
  );
}

/** El volumen: relleno con luz, luz rebotada y brillos. Gira en Y. */
function Body({ clock, shape }: { clock: Clock; shape: SkPath }) {
  const turn = useDerivedValue(() => [{ scaleX: turnScaleX(clock.value) }]);
  const shift = useDerivedValue(() => glintShift(clock.value) * HEART_GLINT_DRIFT);
  const bounceShift = useDerivedValue(() => -shift.value / 2);
  const center = useDerivedValue(() => ({ x: HEART_BODY.cx + shift.value / 2, y: HEART_BODY.cy }));

  return (
    <Group origin={PIVOT} transform={turn}>
      <Path path={shape}>
        <RadialGradient
          c={center}
          r={HEART_BODY.r}
          colors={BODY_COLORS}
          positions={BODY_POSITIONS}
        />
      </Path>
      <Group clip={shape}>
        <GlowOval spec={HEART_BOUNCE} dx={bounceShift} />
        <GlowOval spec={HEART_SHEEN} dx={shift} />
        <GlowOval spec={HEART_SPARK} dx={shift} />
      </Group>
    </Group>
  );
}

/**
 * El mismo latido, en hueso y con resplandor, recortado a la silueta.
 *
 * El resplandor esta permitido aqui porque este latido es decorativo, no una
 * senal diagnostica: §13 prohibe el brillo sobre el trazado real.
 */
function InnerTrace(props: {
  clock: Clock;
  layout: HeartSceneLayout;
  shape: SkPath;
  trace: SkPath;
}) {
  const { clock, layout, shape, trace } = props;
  const end = useDerivedValue(() => traceEnd(clock.value));
  const inner = layout.innerTrace;

  return (
    <Group clip={shape}>
      <Group transform={[{ translateX: inner.x }, { translateY: inner.y }, { scale: inner.scale }]}>
        <Path
          path={trace}
          style="stroke"
          strokeWidth={TRACE_STROKE / layout.trace.scale}
          strokeCap="round"
          strokeJoin="round"
          color={HEART_TRACE_INK}
          start={0}
          end={end}
        >
          <BlurMask blur={TRACE_GLOW / layout.trace.scale} style="solid" />
        </Path>
      </Group>
    </Group>
  );
}
