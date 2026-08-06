import {
  assessQuality,
  focusVariance,
  glareFraction,
  meanLuminance,
  MIN_PIXELS_PER_MM,
  pixelsPerMillimetre,
  type QualityInput,
} from '@/camera/quality';

const SIDE = 32;

/** Imagen uniforme: sin bordes, como una foto completamente desenfocada. */
function flat(level: number): Uint8Array {
  return new Uint8Array(SIDE * SIDE).fill(level);
}

/** Damero de un pixel: el sujeto con mas bordes posible, como una retícula nitida. */
function checkerboard(low: number, high: number): Uint8Array {
  const pixels = new Uint8Array(SIDE * SIDE);
  for (let y = 0; y < SIDE; y += 1) {
    for (let x = 0; x < SIDE; x += 1) {
      pixels[y * SIDE + x] = (x + y) % 2 === 0 ? high : low;
    }
  }
  return pixels;
}

/** Ancho de recorte que supera holgadamente el minimo de pixeles por milimetro. */
const AMPLE_WIDTH_PX = MIN_PIXELS_PER_MM * 250 * 2;

function inputFrom(gray: Uint8Array, capturedWidthPx = AMPLE_WIDTH_PX): QualityInput {
  return { gray, width: SIDE, height: SIDE, capturedWidthPx };
}

describe('pixelsPerMillimetre', () => {
  // Diez segundos a 25 mm/s son 250 mm de trazado, reparta como reparta el
  // montaje. De ahi que baste el ancho para saber la resolucion sobre el papel.
  it('divide el ancho entre los 250 mm nominales del trazado', () => {
    expect(pixelsPerMillimetre(2000)).toBe(8);
  });
});

describe('focusVariance', () => {
  it('se anula en una imagen uniforme', () => {
    expect(focusVariance(flat(128), SIDE, SIDE)).toBe(0);
  });

  it('es alta en una imagen llena de bordes', () => {
    expect(focusVariance(checkerboard(60, 200), SIDE, SIDE)).toBeGreaterThan(1000);
  });

  it('devuelve cero si la imagen no tiene interior', () => {
    expect(focusVariance(new Uint8Array([1, 2, 3, 4]), 2, 2)).toBe(0);
  });
});

describe('glareFraction', () => {
  it('no cuenta el papel claro como reflejo', () => {
    // 235 es papel bien iluminado, no un brillo quemado.
    expect(glareFraction(flat(235))).toBe(0);
  });

  it('cuenta los pixeles quemados', () => {
    const pixels = flat(180);
    pixels.fill(255, 0, pixels.length / 4);

    expect(glareFraction(pixels)).toBeCloseTo(0.25);
  });
});

describe('meanLuminance', () => {
  it('promedia la imagen', () => {
    expect(meanLuminance(flat(90))).toBe(90);
  });
});

describe('assessQuality', () => {
  it('no encuentra nada en una foto nitida, bien expuesta y de resolucion suficiente', () => {
    expect(assessQuality(inputFrom(checkerboard(60, 200)))).toEqual([]);
  });

  it('avisa de resolucion insuficiente aunque la foto sea perfecta', () => {
    // La resolucion es el unico defecto sin arreglo posterior: no se recupera
    // detalle que el sensor nunca recogio.
    const findings = assessQuality(inputFrom(checkerboard(60, 200), 1000));

    expect(findings).toHaveLength(1);
    expect(findings[0]?.issue).toBe('low-resolution');
    expect(findings[0]?.measured).toBe(4);
  });

  it('avisa de foto movida', () => {
    const findings = assessQuality(inputFrom(flat(150)));

    expect(findings.map((finding) => finding.issue)).toEqual(['blurry']);
  });

  it('avisa de reflejo sobre la retícula', () => {
    const pixels = checkerboard(60, 200);
    pixels.fill(255, 0, Math.floor(pixels.length * 0.1));

    expect(findings(pixels)).toContain('glare');
  });

  it('avisa de subexposicion', () => {
    expect(findings(checkerboard(2, 20))).toContain('underexposed');
  });

  it('devuelve la resolucion primero cuando concurren varios problemas', () => {
    const findings = assessQuality(inputFrom(flat(20), 500));

    expect(findings.map((finding) => finding.issue)).toEqual([
      'low-resolution',
      'blurry',
      'underexposed',
    ]);
  });
});

function findings(gray: Uint8Array): readonly string[] {
  return assessQuality(inputFrom(gray)).map((finding) => finding.issue);
}
