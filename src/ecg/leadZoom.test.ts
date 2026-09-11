import { STANDARD_CALIBRATION } from '@/capture/study';
import { computeGridGeometry } from '@/ecg/grid';
import { computeLeadZoom, formatScaleNumber, ZOOM_PIXELS_PER_MM } from '@/ecg/leadZoom';

describe('computeLeadZoom', () => {
  it('amplia sin tocar la calibracion: un cuadro pequeno sigue valiendo 0,04 s', () => {
    const zoom = computeLeadZoom({ fromSecond: 0, toSecond: 2.5 }, STANDARD_CALIBRATION);
    const grid = computeGridGeometry(zoom.scale);

    expect(zoom.scale.pixelsPerMm).toBe(ZOOM_PIXELS_PER_MM);
    expect(grid.smallStepPx / zoom.scale.pixelsPerSecond).toBeCloseTo(0.04);
    expect(grid.smallStepPx / zoom.scale.pixelsPerMillivolt).toBeCloseTo(0.1);
  });

  it('da a una tira de diez segundos su papel entero, 250 mm', () => {
    const zoom = computeLeadZoom({ fromSecond: 0, toSecond: 10 }, STANDARD_CALIBRATION);

    expect(zoom.width).toBeCloseTo(250 * ZOOM_PIXELS_PER_MM);
  });

  // Con el limite de 512 puntos del visor, diez segundos a 8 px/mm son 2000 px
  // de ancho: se perderia la forma del QRS que se amplia para ver.
  it('decima a un punto por pixel, no al limite del visor', () => {
    const zoom = computeLeadZoom({ fromSecond: 0, toSecond: 10 }, STANDARD_CALIBRATION);

    expect(zoom.maxPointsPerSegment).toBeGreaterThanOrEqual(zoom.width);
  });
});

describe('formatScaleNumber', () => {
  it('escribe con coma decimal', () => {
    expect(formatScaleNumber(1 / 25)).toBe('0,04');
    expect(formatScaleNumber(1 / 10)).toBe('0,1');
  });
});
