import { TRACE_QRS_FRACTION, TRACE_T_END_FRACTION } from '@/design/heartArt';

/**
 * Guion de la animacion del arranque, en funcion de un unico reloj `t` de 0 a 1.
 *
 * FUNCIONES PURAS Y WORKLETS. La pantalla las evalua en el hilo de UI desde un
 * solo valor compartido, y el script de vistas previas las evalua en Node con el
 * mismo `t`: lo que se ve en las imagenes es lo que hace la aplicacion.
 *
 * En `t = 1` todo esta en reposo. Es el fotograma de movimiento reducido (§11):
 * corazon de frente, trazo completo, sin pulso ni onda.
 *
 * Secuencia, sobre 1800 ms:
 *  1. El corazon da una vuelta en Y y se frena de frente (0 a 0,34).
 *  2. El trazo cruza la pantalla a velocidad constante (0,18 a 0,8).
 *  3. Cuando la pluma pasa por el QRS, primer latido (lub) y onda expansiva.
 *     Cuando termina la onda T, segundo latido, mas debil (dub). Es el orden
 *     real: el primer ruido sigue al QRS y el segundo al final de la T.
 */
const T = {
  turnEnd: 0.34,
  traceStart: 0.18,
  traceEnd: 0.8,
  pulseWidth: 0.13,
  rippleWidth: 0.3,
  lub: 0.1,
  dub: 0.055,
} as const;

const TAU = Math.PI * 2;

function clamp01(x: number): number {
  'worklet';
  return Math.min(1, Math.max(0, x));
}

function easeOutCubic(x: number): number {
  'worklet';
  return 1 - (1 - x) ** 3;
}

/** Momento en que la pluma pasa por una fraccion del trazo. */
function penAt(fraction: number): number {
  'worklet';
  return T.traceStart + fraction * (T.traceEnd - T.traceStart);
}

/** Un golpe: sube rapido y cae despacio. Cero fuera de su ventana. */
function pulse(t: number, at: number): number {
  'worklet';
  const x = (t - at) / T.pulseWidth;
  if (x <= 0 || x >= 1) return 0;
  return x < 0.25 ? Math.sin((x / 0.25) * (Math.PI / 2)) : (1 - (x - 0.25) / 0.75) ** 2;
}

/** Instante del primer latido, para las pruebas y las vistas previas. */
export function lubAt(): number {
  'worklet';
  return penAt(TRACE_QRS_FRACTION);
}

/** Instante del segundo latido. */
export function dubAt(): number {
  'worklet';
  return penAt(TRACE_T_END_FRACTION);
}

/** Cuanto del trazo esta dibujado, de 0 a 1. */
export function traceEnd(t: number): number {
  'worklet';
  return clamp01((t - T.traceStart) / (T.traceEnd - T.traceStart));
}

/** Escala del latido doble. 1 en reposo. */
export function beatScale(t: number): number {
  'worklet';
  return 1 + T.lub * pulse(t, lubAt()) + T.dub * pulse(t, dubAt());
}

/** Energia del latido entre 0 y 1: alimenta el halo y la sombra. */
export function beatEnergy(t: number): number {
  'worklet';
  return (beatScale(t) - 1) / T.lub;
}

/** Angulo del giro en Y: una vuelta entera que se frena de frente. */
function turnAngle(t: number): number {
  'worklet';
  return TAU * (1 - easeOutCubic(clamp01(t / T.turnEnd)));
}

/**
 * Anchura aparente durante el giro. Nunca negativa: un corazon en espejo
 * moveria la luz de lado, y la luz de la escena no gira con el objeto.
 */
export function turnScaleX(t: number): number {
  'worklet';
  return Math.max(0.02, Math.abs(Math.cos(turnAngle(t))));
}

/** Desplazamiento de los brillos durante el giro, de -1 a 1. */
export function glintShift(t: number): number {
  'worklet';
  return -Math.sin(turnAngle(t));
}

/** Anchura de la sombra: sigue al giro y se abre con cada latido. */
export function shadowScaleX(t: number): number {
  'worklet';
  return (0.55 + 0.45 * turnScaleX(t)) * (1 + 0.3 * beatEnergy(t));
}

/** La sombra se aclara cuando el corazon crece, como si se separase del suelo. */
export function shadowOpacity(t: number): number {
  'worklet';
  return 1 - 0.35 * beatEnergy(t);
}

/** El halo respira con el latido y queda encendido a media luz en reposo. */
export function glowOpacity(t: number): number {
  'worklet';
  return 0.6 + 0.4 * beatEnergy(t);
}

/** Onda expansiva del primer latido: escala y opacidad. */
export function ripple(t: number): { scale: number; opacity: number } {
  'worklet';
  const x = (t - lubAt()) / T.rippleWidth;
  if (x <= 0 || x >= 1) return { scale: 1, opacity: 0 };
  return { scale: 1.06 + 0.4 * easeOutCubic(x), opacity: 0.5 * (1 - x) };
}
