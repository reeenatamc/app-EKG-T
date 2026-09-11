import { STANDARD_CALIBRATION } from '@/capture/study';
import { computeGridGeometry } from '@/ecg/grid';
import { rhythmStripLeads } from '@/ecg/leads';
import type { EcgSignal, LeadName } from '@/ecg/signal';
import { computeViewerLayout } from '@/ecg/viewerLayout';

const WIDTH = 400;
const SAMPLING_RATE_HZ = 500;

type Spans = Readonly<Record<string, readonly (readonly [number, number])[]>>;

/** Una senal con cada derivacion registrada en los tramos pedidos, en segundos. */
function signalWith(durationSeconds: number, spans: Spans): EcgSignal {
  return {
    samplingRateHz: SAMPLING_RATE_HZ,
    durationSeconds,
    leads: Object.entries(spans).map(([name, ranges]) => ({
      name: name as LeadName,
      segments: ranges.map(([from, to]) => ({
        startSecond: from,
        values: new Array<number>(Math.round((to - from) * SAMPLING_RATE_HZ)).fill(0),
      })),
    })),
  };
}

/** Un 3x4 de diez segundos: cada derivacion, solo en su columna. */
const GRID_3X4: Spans = {
  I: [[0, 2.5]],
  II: [[0, 2.5]],
  III: [[0, 2.5]],
  aVR: [[2.5, 5]],
  aVL: [[2.5, 5]],
  aVF: [[2.5, 5]],
  V1: [[5, 7.5]],
  V2: [[5, 7.5]],
  V3: [[5, 7.5]],
  V4: [[7.5, 10]],
  V5: [[7.5, 10]],
  V6: [[7.5, 10]],
};

const STANDARD = signalWith(10, GRID_3X4);

/** Lo que llega del servidor para un 3x4 con tres tiras, el caso mas comun medido. */
const WITH_THREE_STRIPS = signalWith(10, {
  ...GRID_3X4,
  II: [[0, 10]],
  V1: [[0, 10]],
  V5: [[0, 10]],
});

/** Los mismos tramos a otra escala de tiempo, como los corrige el servidor. */
function rescaled(spans: Spans, factor: number): Spans {
  return Object.fromEntries(
    Object.entries(spans).map(([name, ranges]) => [
      name,
      ranges.map(([from, to]) => [from * factor, to * factor] as const),
    ]),
  );
}

describe('computeViewerLayout', () => {
  it('reparte un 3x4 en cuatro columnas y tres filas', () => {
    const layout = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION, STANDARD);

    expect(layout.cells).toHaveLength(12);
    expect(layout.cells.filter((cell) => cell.x === 0)).toHaveLength(3);
  });

  // La columna tiene que caber exactamente en su ventana temporal: de ahi sale
  // la escala, y de la escala salen la retícula y el trazado.
  it('ajusta la escala para que cada columna ocupe justo sus 2,5 s', () => {
    const layout = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION, STANDARD);
    const [first] = layout.cells;

    expect(first?.width).toBeCloseTo(WIDTH / 4);
    expect((first?.width ?? 0) / layout.scale.pixelsPerSecond).toBeCloseTo(2.5);
  });

  // La misma comprobacion que en grid.test.ts, pero sobre la escala que sale del
  // reparto real: si el visor deforma la escala para que quepa, aqui se ve.
  it('mantiene la retícula calibrada a 0,04 s por cuadro pequeno', () => {
    const layout = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION, STANDARD);
    const grid = computeGridGeometry(layout.scale);

    expect(grid.smallStepPx / layout.scale.pixelsPerSecond).toBeCloseTo(0.04);
  });

  it('da a cada celda la ventana temporal de su columna', () => {
    const layout = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION, STANDARD);
    const lastColumn = layout.cells.filter((cell) => cell.fromSecond === 7.5);

    expect(lastColumn).toHaveLength(3);
    expect(lastColumn[0]?.toSecond).toBeCloseTo(10);
  });

  it('anade una fila entera para la tira de ritmo', () => {
    const signal = signalWith(10, { ...GRID_3X4, II: [[0, 10]] });
    const withStrip = computeViewerLayout('rhythm-3x4', WIDTH, STANDARD_CALIBRATION, signal);
    const strip = withStrip.cells[withStrip.cells.length - 1];

    expect(withStrip.cells).toHaveLength(13);
    expect(strip?.lead).toBe('II');
    expect(strip?.width).toBe(WIDTH);
    expect(strip?.toSecond).toBeCloseTo(10);
  });

  it('coloca la linea de base en el centro de su fila', () => {
    const layout = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION, STANDARD);
    const [first] = layout.cells;

    expect(first?.baselineY).toBeCloseTo((first?.height ?? 0) / 2);
  });

  it('un 12x1 apila las doce en una sola columna de diez segundos', () => {
    const allFull = signalWith(
      10,
      Object.fromEntries(Object.keys(GRID_3X4).map((name) => [name, [[0, 10] as const]])),
    );
    const layout = computeViewerLayout('twelve-1', WIDTH, STANDARD_CALIBRATION, allFull);

    // Y ninguna de las doce se toma por tira: en un 12x1 cada columna ya es el
    // registro entero.
    expect(layout.cells).toHaveLength(12);
    expect(layout.cells.every((cell) => cell.fromSecond === 0)).toBe(true);
    expect(layout.cells[0]?.toSecond).toBeCloseTo(10);
  });

  // EL CASO QUE ROMPIA EL VISOR. El servidor corrige la velocidad: un registro a
  // 50 mm/s llega con 5 s, y la derivacion aVR entre 1,25 y 2,5 s. Con los diez
  // segundos supuestos, su celda la buscaba entre 2,5 y 5 s y salia vacia, igual
  // que otras ocho.
  it('toma la duracion de la senal: un registro a 50 mm/s abarca 5 s', () => {
    const fast = { speedMmPerSecond: 50, gainMmPerMillivolt: 20 };
    const signal = signalWith(5, rescaled(GRID_3X4, 0.5));
    const layout = computeViewerLayout('standard-3x4', WIDTH, fast, signal);

    const aVR = layout.cells.find((cell) => cell.lead === 'aVR');
    expect(aVR?.fromSecond).toBeCloseTo(1.25);
    expect(aVR?.toSecond).toBeCloseTo(2.5);

    // Y la columna sigue midiendo el mismo papel: 1,25 s a 50 mm/s son 62,5 mm,
    // como 2,5 s a 25 mm/s. Contar cuadros da lo mismo que en la hoja.
    const [first] = layout.cells;
    expect((first?.width ?? 0) / layout.scale.pixelsPerMm).toBeCloseTo(62.5);
    expect(
      computeGridGeometry(layout.scale).smallStepPx / layout.scale.pixelsPerSecond,
    ).toBeCloseTo(0.02);
  });

  // Media velocidad: la misma hoja abarca el doble de tiempo. El milimetro de
  // pantalla no cambia; lo que cambia es cuanto tiempo vale un cuadro.
  it('sigue a la calibracion cuando no es la estandar', () => {
    const half = { speedMmPerSecond: 12.5, gainMmPerMillivolt: 10 };
    const layout = computeViewerLayout(
      'standard-3x4',
      WIDTH,
      half,
      signalWith(20, rescaled(GRID_3X4, 2)),
    );
    const standard = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION, STANDARD);

    expect(layout.scale.pixelsPerMm).toBeCloseTo(standard.scale.pixelsPerMm);
    expect(
      computeGridGeometry(layout.scale).smallStepPx / layout.scale.pixelsPerSecond,
    ).toBeCloseTo(0.08);
  });

  // Medido sobre los registros reales: el digitalizador identifica un 3x4 con tres
  // tiras que se encuadro como 3x4 simple. Los diez segundos de II, V1 y V5
  // llegaban y no se dibujaban.
  it('dibuja las tiras que trae la senal aunque el montaje no las anuncie', () => {
    const layout = computeViewerLayout(
      'standard-3x4',
      WIDTH,
      STANDARD_CALIBRATION,
      WITH_THREE_STRIPS,
    );
    const strips = layout.cells.slice(12);

    expect(strips.map((cell) => cell.lead)).toEqual(['II', 'V1', 'V5']);
    expect(new Set(strips.map((cell) => cell.y)).size).toBe(3);
    expect(layout.height).toBeCloseTo((3 + 3) * (layout.cells[0]?.height ?? 0));
  });

  it('no dibuja una tira vacia si el montaje la anuncia pero la senal no la trae', () => {
    const layout = computeViewerLayout('rhythm-3x4', WIDTH, STANDARD_CALIBRATION, STANDARD);

    expect(layout.cells).toHaveLength(12);
  });
});

describe('rhythmStripLeads', () => {
  // Una tira puede traer huecos donde el digitalizador perdio el trazo: el II real
  // llego en dos tramos, 0-8,31 s y 9,76-10 s. Sigue siendo una tira.
  it('cuenta como tira una derivacion con huecos que abarca el registro', () => {
    const signal = signalWith(10, {
      ...GRID_3X4,
      II: [
        [0, 8.31],
        [9.76, 10],
      ],
    });

    expect(rhythmStripLeads(signal, 'standard-3x4')).toEqual(['II']);
  });

  it('pone II, V1 y V5 delante de cualquier otra', () => {
    const signal = signalWith(10, { ...GRID_3X4, V5: [[0, 10]], I: [[0, 10]], II: [[0, 10]] });

    expect(rhythmStripLeads(signal, 'standard-3x4')).toEqual(['II', 'V5', 'I']);
  });
});

describe('identidad de las celdas', () => {
  // De donde sale: en un 3x4 con tira de ritmo, la derivacion de la tira aparece
  // dos veces -- en su celda de la rejilla y abajo, entera-- y las dos empiezan
  // en el segundo cero. Identificarlas solo por derivacion y comienzo las hacia
  // indistinguibles, React avisaba de dos hijos con la misma clave, y al
  // redibujar podia confundir una con otra.
  const MOUNTS = ['standard-3x4', 'rhythm-3x4', 'right-3x3', 'six-2', 'twelve-1'] as const;
  // Con II registrada a lo largo de todo el papel, que es lo que la convierte en
  // tira: desde que las tiras salen de la senal, sin ella no habria ninguna fila
  // de ritmo y el caso que vigila esta prueba no llegaria a darse.
  const WITH_II_STRIP = signalWith(10, { ...GRID_3X4, II: [[0, 10]] });

  it.each(MOUNTS)('en %s, derivacion, comienzo y fila distinguen cada celda', (mount) => {
    const { cells } = computeViewerLayout(mount, WIDTH, STANDARD_CALIBRATION, WITH_II_STRIP);
    const identities = cells.map((cell) => `${cell.lead}-${cell.fromSecond}-${cell.y}`);

    expect(new Set(identities).size).toBe(cells.length);
  });

  it('en un 3x4 con tira, la derivacion de la tira sale dos veces', () => {
    // La razon de ser del test de arriba, fijada aparte para que se vea que el
    // caso existe y no es teorico.
    const { cells } = computeViewerLayout('rhythm-3x4', WIDTH, STANDARD_CALIBRATION, WITH_II_STRIP);
    const repeated = cells.filter((cell) => cell.lead === 'II');

    expect(repeated).toHaveLength(2);
    expect(repeated.every((cell) => cell.fromSecond === 0)).toBe(true);
  });
});
