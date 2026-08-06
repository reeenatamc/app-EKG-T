import { STANDARD_CALIBRATION } from '@/capture/study';
import { computeGridGeometry } from '@/ecg/grid';
import { RECORD_SECONDS } from '@/ecg/leads';
import { computeViewerLayout } from '@/ecg/viewerLayout';

const WIDTH = 400;

describe('computeViewerLayout', () => {
  it('reparte un 3x4 en cuatro columnas y tres filas', () => {
    const layout = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION);

    expect(layout.cells).toHaveLength(12);
    expect(layout.cells.filter((cell) => cell.x === 0)).toHaveLength(3);
  });

  // La columna tiene que caber exactamente en su ventana temporal: de ahi sale
  // la escala, y de la escala salen la retícula y el trazado.
  it('ajusta la escala para que cada columna ocupe justo sus 2,5 s', () => {
    const layout = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION);
    const [first] = layout.cells;

    expect(first?.width).toBeCloseTo(WIDTH / 4);
    expect((first?.width ?? 0) / layout.scale.pixelsPerSecond).toBeCloseTo(2.5);
  });

  // La misma comprobacion que en grid.test.ts, pero sobre la escala que sale del
  // reparto real: si el visor deforma la escala para que quepa, aqui se ve.
  it('mantiene la retícula calibrada a 0,04 s por cuadro pequeno', () => {
    const layout = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION);
    const grid = computeGridGeometry(layout.scale);

    expect(grid.smallStepPx / layout.scale.pixelsPerSecond).toBeCloseTo(0.04);
  });

  it('da a cada celda la ventana temporal de su columna', () => {
    const layout = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION);
    const lastColumn = layout.cells.filter((cell) => cell.fromSecond === 7.5);

    expect(lastColumn).toHaveLength(3);
    expect(lastColumn[0]?.toSecond).toBeCloseTo(RECORD_SECONDS);
  });

  it('anade una fila entera para la tira de ritmo', () => {
    const withStrip = computeViewerLayout('rhythm-3x4', WIDTH, STANDARD_CALIBRATION);
    const strip = withStrip.cells[withStrip.cells.length - 1];

    expect(withStrip.cells).toHaveLength(13);
    expect(strip?.width).toBe(WIDTH);
    expect(strip?.toSecond).toBeCloseTo(RECORD_SECONDS);
  });

  it('coloca la linea de base en el centro de su fila', () => {
    const layout = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION);
    const [first] = layout.cells;

    expect(first?.baselineY).toBeCloseTo((first?.height ?? 0) / 2);
  });

  it('un 12x1 apila las doce en una sola columna de diez segundos', () => {
    const layout = computeViewerLayout('twelve-1', WIDTH, STANDARD_CALIBRATION);

    expect(layout.cells).toHaveLength(12);
    expect(layout.cells.every((cell) => cell.fromSecond === 0)).toBe(true);
    expect(layout.cells[0]?.toSecond).toBeCloseTo(RECORD_SECONDS);
  });

  // Media velocidad significa que el mismo tiempo ocupa la mitad de papel, asi
  // que en el mismo ancho de pantalla cabe el doble de milimetros.
  it('sigue a la calibracion cuando no es la estandar', () => {
    const half = computeViewerLayout('standard-3x4', WIDTH, {
      speedMmPerSecond: 12.5,
      gainMmPerMillivolt: 10,
    });
    const standard = computeViewerLayout('standard-3x4', WIDTH, STANDARD_CALIBRATION);

    expect(half.scale.pixelsPerMm).toBeCloseTo(standard.scale.pixelsPerMm * 2);
  });
});
