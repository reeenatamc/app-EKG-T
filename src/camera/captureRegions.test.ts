import { planCapture } from '@/camera/captureRegions';
import { computeFrameRect, type Rect, type Size } from '@/camera/framing';
import { turnSize } from '@/camera/turn';

/** Vista previa de un telefono corriente, en puntos. */
const CONTAINER: Size = { width: 360, height: 800 };
const PORTRAIT_PHOTO: Size = { width: 3000, height: 4000 };
const LANDSCAPE_PHOTO: Size = { width: 4000, height: 3000 };

/** Marco de un 3x4 estandar: apaisado con el telefono de pie, alargado en horizontal. */
const WIDE_FRAME = computeFrameRect(CONTAINER, { width: 3, height: 2 }, 0.06, 0.6);
const TALL_FRAME = computeFrameRect(CONTAINER, { width: 2, height: 3 }, 0.06, 0.6);

function finalSize(plan: ReturnType<typeof planCapture>): Size {
  return turnSize({ width: plan.region.width, height: plan.region.height }, plan.clockwise);
}

function isInside(inner: Rect, outer: Size): boolean {
  return (
    inner.x >= 0 &&
    inner.y >= 0 &&
    inner.x + inner.width <= outer.width &&
    inner.y + inner.height <= outer.height
  );
}

describe('planCapture', () => {
  it('con el telefono de pie no cambia nada respecto a antes', () => {
    const plan = planCapture(CONTAINER, WIDE_FRAME, PORTRAIT_PHOTO, 0);

    expect(plan.clockwise).toBe(0);
    // Un marco apaisado da un recorte apaisado.
    expect(plan.region.width).toBeGreaterThan(plan.region.height);
    expect(isInside(plan.framedRegion, finalSize(plan))).toBe(true);
  });

  it.each([90, 270] as const)(
    'EN HORIZONTAL (%i) EL RECORTE SALE APAISADO Y DENTRO DE LA FOTO GIRADA',
    (turn) => {
      // Era el fallo: la foto llega apaisada y el recorte se calculaba como si
      // llegase en vertical, asi que caia en otro sitio.
      const plan = planCapture(CONTAINER, TALL_FRAME, LANDSCAPE_PHOTO, turn);
      const { region } = plan;

      expect(plan.clockwise).toBe(0);
      expect(region.width).toBeGreaterThan(region.height);
      expect(region.originX + region.width).toBeLessThanOrEqual(LANDSCAPE_PHOTO.width);
      expect(region.originY + region.height).toBeLessThanOrEqual(LANDSCAPE_PHOTO.height);
      expect(isInside(plan.framedRegion, finalSize(plan))).toBe(true);
    },
  );

  it('en horizontal recorta la misma parte del sensor que de pie', () => {
    // El marco alto sobre la foto sin girar y el mismo marco sobre la foto girada
    // son el mismo trozo de papel: solo cambia hacia donde mira.
    const standing = planCapture(CONTAINER, TALL_FRAME, PORTRAIT_PHOTO, 0);
    const sideways = planCapture(CONTAINER, TALL_FRAME, LANDSCAPE_PHOTO, 90);

    expect(sideways.region.width).toBe(standing.region.height);
    expect(sideways.region.height).toBe(standing.region.width);
  });

  it('SI ANDROID NO GIRO LA FOTO, SE GIRA AQUI', () => {
    // La pantalla sabia que el telefono estaba en horizontal, pero la foto llego
    // en vertical: la imagen final tiene que salir igualmente apaisada.
    const plan = planCapture(CONTAINER, TALL_FRAME, PORTRAIT_PHOTO, 90);
    const size = finalSize(plan);

    expect(plan.clockwise).toBe(270);
    expect(size.width).toBeGreaterThan(size.height);
    expect(isInside(plan.framedRegion, size)).toBe(true);
  });

  it('el marco final conserva la proporcion del marco que se vio', () => {
    for (const turn of [0, 90, 180, 270] as const) {
      const photo = turn === 90 || turn === 270 ? LANDSCAPE_PHOTO : PORTRAIT_PHOTO;
      const frame = turn === 90 || turn === 270 ? TALL_FRAME : WIDE_FRAME;
      const { framedRegion } = planCapture(CONTAINER, frame, photo, turn);

      // En la imagen final el registro siempre queda apaisado, 3:2.
      expect(framedRegion.width / framedRegion.height).toBeCloseTo(3 / 2, 1);
    }
  });
});
