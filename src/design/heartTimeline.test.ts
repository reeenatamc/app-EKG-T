import { BEAT_VIEWBOX } from '@/design/beatPoints';
import { HEART_TRACE_SVG, TRACE_QRS_FRACTION, TRACE_T_END_FRACTION } from '@/design/heartArt';
import {
  beatScale,
  dubAt,
  glintShift,
  glowOpacity,
  lubAt,
  ripple,
  shadowOpacity,
  shadowScaleX,
  traceEnd,
  turnScaleX,
} from '@/design/heartTimeline';

/**
 * El guion del corazon del arranque (D-27).
 *
 * Lo que se fija aqui no es estetica: es que el fotograma de movimiento reducido
 * sea de verdad un reposo (§11), que el primer fotograma empalme con el splash
 * nativo y que los dos latidos caigan donde dice la fisiologia.
 */

describe('t = 1 es el reposo de movimiento reducido', () => {
  it('no queda nada en movimiento', () => {
    expect(beatScale(1)).toBe(1);
    expect(turnScaleX(1)).toBe(1);
    expect(glintShift(1)).toBeCloseTo(0, 10);
    expect(traceEnd(1)).toBe(1);
    expect(ripple(1).opacity).toBe(0);
    expect(shadowScaleX(1)).toBe(1);
    expect(shadowOpacity(1)).toBe(1);
    expect(glowOpacity(1)).toBe(0.6);
  });

  it('los latidos terminan antes del final del guion', () => {
    expect(beatScale(0.95)).toBe(1);
    expect(ripple(0.95).opacity).toBe(0);
  });
});

describe('t = 0 empalma con el splash nativo', () => {
  it('el corazon esta de frente y el trazo sin empezar', () => {
    expect(turnScaleX(0)).toBe(1);
    expect(traceEnd(0)).toBe(0);
    expect(beatScale(0)).toBe(1);
  });
});

describe('lub-dub en su sitio', () => {
  it('el primer latido sigue al QRS y el segundo al final de la onda T', () => {
    expect(TRACE_QRS_FRACTION).toBeLessThan(TRACE_T_END_FRACTION);
    expect(lubAt()).toBeLessThan(dubAt());
    expect(dubAt()).toBeLessThan(1);
  });

  it('el primero es mas fuerte que el segundo', () => {
    const peak = (at: number) =>
      Math.max(...[0.01, 0.02, 0.03, 0.04, 0.05].map((d) => beatScale(at + d)));
    expect(peak(lubAt())).toBeGreaterThan(peak(dubAt()));
    expect(peak(dubAt())).toBeGreaterThan(1);
  });

  it('el giro termina antes de que el trazo llegue al corazon', () => {
    expect(turnScaleX(lubAt())).toBe(1);
  });

  it('el QRS cae en el centro de la pantalla', () => {
    expect(HEART_TRACE_SVG).toContain(`L${BEAT_VIEWBOX.width / 2},300`);
  });
});
