import { SHEET_FLING_VELOCITY, sheetClosedOffset, shouldOpenSheet } from '@/shell/sheetSnap';

describe('sheetClosedOffset', () => {
  it('deja fuera la barrita, las pestanas y la zona del sistema', () => {
    expect(sheetClosedOffset(640, 68, 34)).toBe(538);
  });

  it('nunca sube la hoja por encima de abierta', () => {
    expect(sheetClosedOffset(60, 68, 34)).toBe(0);
  });
});

describe('shouldOpenSheet', () => {
  const CLOSED = 500;

  it('sin lanzamiento, va al lado donde se solto', () => {
    expect(shouldOpenSheet(200, 0, CLOSED)).toBe(true);
    expect(shouldOpenSheet(300, 0, CLOSED)).toBe(false);
  });

  it('justo a mitad de camino se cierra', () => {
    expect(shouldOpenSheet(CLOSED / 2, 0, CLOSED)).toBe(false);
  });

  it('un lanzamiento hacia arriba abre aunque se suelte abajo', () => {
    expect(shouldOpenSheet(480, -SHEET_FLING_VELOCITY, CLOSED)).toBe(true);
  });

  it('un lanzamiento hacia abajo cierra aunque se suelte arriba', () => {
    expect(shouldOpenSheet(20, SHEET_FLING_VELOCITY, CLOSED)).toBe(false);
  });
});
