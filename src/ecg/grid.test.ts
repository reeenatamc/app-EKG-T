import { STANDARD_CALIBRATION } from '@/capture/study';
import {
  boldLineInterval,
  computeGridGeometry,
  computeTraceScale,
  millivoltsPerMillimetre,
  secondsPerMillimetre,
  visibleSeconds,
  type GridGeometry,
} from '@/ecg/grid';

const PIXELS_PER_MM = 4;

describe('secondsPerMillimetre', () => {
  it('da 0,04 s por milimetro a la velocidad estandar', () => {
    expect(secondsPerMillimetre(25)).toBeCloseTo(0.04);
  });

  it('duplica el tiempo por milimetro a media velocidad', () => {
    expect(secondsPerMillimetre(12.5)).toBeCloseTo(0.08);
  });
});

describe('millivoltsPerMillimetre', () => {
  it('da 0,1 mV por milimetro a la amplitud estandar', () => {
    expect(millivoltsPerMillimetre(10)).toBeCloseTo(0.1);
  });
});

describe('computeTraceScale y computeGridGeometry', () => {
  // ESTA ES LA PRUEBA QUE IMPORTA. No comprueba una constante, comprueba que la
  // retícula que se dibuja y la escala a la que se dibuja el trazado salen del
  // mismo sitio. Si alguien cambia una sin la otra, quien mida contando cuadros
  // obtendra un intervalo equivocado y el trazado seguira pareciendo correcto.
  it('un cuadro pequeno de la retícula vale 0,04 s sobre el trazado', () => {
    const scale = computeTraceScale(STANDARD_CALIBRATION, PIXELS_PER_MM);
    const grid = computeGridGeometry(scale);

    expect(grid.smallStepPx / scale.pixelsPerSecond).toBeCloseTo(0.04);
  });

  it('un cuadro pequeno de la retícula vale 0,1 mV sobre el trazado', () => {
    const scale = computeTraceScale(STANDARD_CALIBRATION, PIXELS_PER_MM);
    const grid = computeGridGeometry(scale);

    expect(grid.smallStepPx / scale.pixelsPerMillivolt).toBeCloseTo(0.1);
  });

  it('el cuadro grande son cinco pequenos, como en el papel', () => {
    const grid = computeGridGeometry(computeTraceScale(STANDARD_CALIBRATION, PIXELS_PER_MM));

    expect(grid.boldStepPx).toBeCloseTo(grid.smallStepPx * 5);
  });

  // Con media velocidad, el mismo cuadro vale el doble de tiempo. La retícula no
  // cambia de tamano: cambia lo que significa, y por eso la calibracion tiene
  // que viajar con el estudio.
  it('sigue a la calibracion cuando no es la estandar', () => {
    const scale = computeTraceScale(
      { speedMmPerSecond: 12.5, gainMmPerMillivolt: 20 },
      PIXELS_PER_MM,
    );
    const grid = computeGridGeometry(scale);

    expect(grid.smallStepPx / scale.pixelsPerSecond).toBeCloseTo(0.08);
    expect(grid.smallStepPx / scale.pixelsPerMillivolt).toBeCloseTo(0.05);
  });

  it('el paso de la retícula no depende de la calibracion, solo de la pantalla', () => {
    const fast = computeGridGeometry(computeTraceScale(STANDARD_CALIBRATION, PIXELS_PER_MM));
    const slow = computeGridGeometry(
      computeTraceScale({ speedMmPerSecond: 50, gainMmPerMillivolt: 5 }, PIXELS_PER_MM),
    );

    expect(fast.smallStepPx).toBe(slow.smallStepPx);
  });
});

describe('visibleSeconds', () => {
  it('dice cuanto registro cabe en un ancho dado', () => {
    const scale = computeTraceScale(STANDARD_CALIBRATION, PIXELS_PER_MM);

    // 25 mm/s a 4 px/mm son 100 px por segundo.
    expect(visibleSeconds(400, scale)).toBeCloseTo(4);
  });
});

describe('boldLineInterval', () => {
  /** Cuantas lineas gruesas salen al recorrer un ancho, como hace el visor. */
  function boldLinesAcross(geometry: GridGeometry, width: number): number {
    const every = boldLineInterval(geometry);
    let count = 0;

    for (let i = 0; i * geometry.smallStepPx <= width; i += 1) {
      if (i % every === 0) {
        count += 1;
      }
    }

    return count;
  }

  it('UNA GRUESA CADA CINCO, SIEMPRE', () => {
    // La retícula son cuadros de un milimetro con una gruesa cada cinco. Es una
    // proporcion fija del papel, no algo que dependa del tamano de la pantalla.
    const geometry = computeGridGeometry(computeTraceScale(STANDARD_CALIBRATION, 1.28));

    expect(boldLineInterval(geometry)).toBe(5);
  });

  it('no se pierde ninguna gruesa a lo ancho de un movil', () => {
    // De donde sale: midiendo el resto de una posicion acumulada, 61 de 101
    // lineas se clasificaban como finas. Y con la retícula fina oculta, que es
    // el caso a este tamano, una gruesa mal clasificada no se dibuja mas
    // delgada: desaparece, y deja bandas de papel en blanco.
    const geometry = computeGridGeometry(computeTraceScale(STANDARD_CALIBRATION, 1.28));
    const width = 640;

    expect(boldLinesAcross(geometry, width)).toBe(Math.floor(width / geometry.boldStepPx) + 1);
  });

  it('aguanta escalas donde el paso grueso no es multiplo exacto del fino', () => {
    const geometry = computeGridGeometry(computeTraceScale(STANDARD_CALIBRATION, 3.7));

    expect(boldLineInterval(geometry)).toBe(5);
  });
});
