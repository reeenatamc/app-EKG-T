import { Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/**
 * Presets de movimiento de SKILL.md §11.
 *
 * Solo se animan transform y opacity. Animar propiedades de disposicion obliga
 * a Yoga a recalcular en cada fotograma.
 *
 * Toda animacion consulta useReducedMotion() y, si esta activo, salta al estado
 * final; nunca se limita a acortar la duracion.
 */

/** Muelle suave, unico de la aplicacion. */
export const spring: WithSpringConfig = { damping: 18, stiffness: 180, mass: 0.9 };

/** Curva unica de la aplicacion. */
const easing = Easing.bezier(0.32, 0.72, 0, 1);

/**
 * Construye la configuracion de una transicion con la curva del sistema.
 *
 * Devuelve la configuracion en lugar de la animacion ya creada, para que quien
 * la use elija el valor destino sin duplicar la curva.
 *
 * @param duration Duracion en milisegundos, tomada de tokens.motion.
 * @returns Configuracion lista para withTiming.
 */
export function timing(duration: number): WithTimingConfig {
  return { duration, easing };
}
