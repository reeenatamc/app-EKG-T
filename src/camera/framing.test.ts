import {
  computeContainRect,
  computeCropRegion,
  computeFrameRect,
  type Size,
} from '@/camera/framing';

const ASPECT_3_2: Size = { width: 3, height: 2 };

describe('computeFrameRect', () => {
  it('centra el marco y respeta la proporcion pedida', () => {
    const frame = computeFrameRect({ width: 400, height: 800 }, ASPECT_3_2, 0.06, 0.6);

    expect(frame.width).toBeCloseTo(352);
    expect(frame.height).toBeCloseTo(234.6667);
    expect(frame.x).toBeCloseTo(24);
    expect(frame.y).toBeCloseTo(282.6667);
    expect(frame.width / frame.height).toBeCloseTo(1.5);
  });

  it('reduce el marco cuando el alto disponible manda', () => {
    // Contenedor apaisado: el ancho cabe de sobra pero el alto no.
    const frame = computeFrameRect({ width: 400, height: 300 }, ASPECT_3_2, 0, 0.6);

    expect(frame.height).toBe(180);
    expect(frame.width).toBe(270);
    expect(frame.x).toBe(65);
    expect(frame.y).toBe(60);
  });

  it('nunca se sale del contenedor', () => {
    const container = { width: 400, height: 300 };
    const frame = computeFrameRect(container, ASPECT_3_2, 0.06, 0.6);

    expect(frame.x).toBeGreaterThanOrEqual(0);
    expect(frame.y).toBeGreaterThanOrEqual(0);
    expect(frame.x + frame.width).toBeLessThanOrEqual(container.width);
    expect(frame.y + frame.height).toBeLessThanOrEqual(container.height);
  });
});

describe('computeCropRegion', () => {
  it('escala linealmente cuando foto y contenedor comparten proporcion', () => {
    // 400x800 y 1000x2000 tienen la misma proporcion: no hay area oculta.
    const { region, wasClamped } = computeCropRegion({
      container: { width: 400, height: 800 },
      frame: { x: 50, y: 300, width: 300, height: 200 },
      photo: { width: 1000, height: 2000 },
    });

    expect(region).toEqual({ originX: 125, originY: 750, width: 750, height: 500 });
    expect(wasClamped).toBe(false);
  });

  it('compensa el area que la vista previa oculta a los lados', () => {
    // Este es EL caso critico. Foto 3000x4000 (0.75) en contenedor 400x800 (0.5):
    // la capa nativa escala por altura y oculta 100 puntos a cada lado.
    // Sin compensar el desplazamiento, originX saldria 250 en vez de 750.
    const { region, wasClamped } = computeCropRegion({
      container: { width: 400, height: 800 },
      frame: { x: 50, y: 300, width: 300, height: 200 },
      photo: { width: 3000, height: 4000 },
    });

    expect(region).toEqual({ originX: 750, originY: 1500, width: 1500, height: 1000 });
    expect(wasClamped).toBe(false);
  });

  it('conserva la proporcion del marco en la region recortada', () => {
    const { region } = computeCropRegion({
      container: { width: 393, height: 852 },
      frame: { x: 23.58, y: 310.72, width: 345.84, height: 230.56 },
      photo: { width: 3024, height: 4032 },
    });

    expect(region.width / region.height).toBeCloseTo(1.5, 2);
  });

  it('centra la region cuando el marco esta centrado en el contenedor', () => {
    const photo = { width: 3000, height: 4000 };
    const { region } = computeCropRegion({
      container: { width: 400, height: 800 },
      frame: { x: 50, y: 300, width: 300, height: 200 },
      photo,
    });

    const marginLeft = region.originX;
    const marginRight = photo.width - (region.originX + region.width);

    expect(marginLeft).toBeCloseTo(marginRight);
  });

  it('ajusta al limite y lo senala cuando la region se sale de la foto', () => {
    const { region, wasClamped } = computeCropRegion({
      container: { width: 400, height: 800 },
      frame: { x: 0, y: 0, width: 400, height: 900 },
      photo: { width: 3000, height: 4000 },
    });

    expect(wasClamped).toBe(true);
    expect(region.originY + region.height).toBeLessThanOrEqual(4000);
    expect(region.originX + region.width).toBeLessThanOrEqual(3000);
  });

  it('devuelve siempre enteros, que es lo que exige el recorte nativo', () => {
    const { region } = computeCropRegion({
      container: { width: 393, height: 852 },
      frame: { x: 23.58, y: 310.72, width: 345.84, height: 230.56 },
      photo: { width: 3024, height: 4032 },
    });

    expect(Number.isInteger(region.originX)).toBe(true);
    expect(Number.isInteger(region.originY)).toBe(true);
    expect(Number.isInteger(region.width)).toBe(true);
    expect(Number.isInteger(region.height)).toBe(true);
  });
});

describe('computeContainRect', () => {
  it('centra el contenido y lo deja entero cuando manda el ancho', () => {
    // Contenido apaisado en contenedor cuadrado: sobra alto arriba y abajo.
    const rect = computeContainRect({ width: 400, height: 400 }, { width: 3000, height: 2000 });

    expect(rect.x).toBe(0);
    expect(rect.width).toBeCloseTo(400);
    expect(rect.height).toBeCloseTo(266.6667);
    expect(rect.y).toBeCloseTo(66.6667);
  });

  it('centra el contenido cuando manda el alto', () => {
    const rect = computeContainRect({ width: 400, height: 200 }, { width: 1000, height: 1000 });

    expect(rect).toEqual({ x: 100, y: 0, width: 200, height: 200 });
  });

  it('devuelve una region nula si el contenido no tiene tamano', () => {
    expect(computeContainRect({ width: 400, height: 400 }, { width: 0, height: 0 })).toEqual({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    });
  });
});
