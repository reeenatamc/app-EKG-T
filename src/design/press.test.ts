import { PRESSED_SCALE, targetScale } from '@/design/press';

describe('targetScale', () => {
  it('se hunde al pulsar', () => {
    expect(targetScale(true, false)).toBe(PRESSED_SCALE);
  });

  it('vuelve a su tamano al soltar', () => {
    expect(targetScale(false, false)).toBe(1);
  });

  it('con movimiento reducido no se mueve ni pulsado', () => {
    // §11: se salta al estado final, y el estado final de un control pulsado es
    // su tamano normal. Encogerlo al instante seria un parpadeo de tamano.
    expect(targetScale(true, true)).toBe(1);
    expect(targetScale(false, true)).toBe(1);
  });

  it('el hundimiento es perceptible pero no llamativo', () => {
    // Por debajo de un 1 % no se nota y sobra el codigo; por encima de un 5 %
    // un boton ancho parece que se aleja.
    expect(PRESSED_SCALE).toBeGreaterThan(0.95);
    expect(PRESSED_SCALE).toBeLessThan(0.99);
  });
});
