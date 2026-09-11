import { formatStudyDate } from '@/capture/studyDate';

const CAPTURED = '2026-09-11T07:42:06.000Z';

describe('formatStudyDate', () => {
  it('lleva hora y minutos, pero no segundos', () => {
    const text = formatStudyDate(CAPTURED);

    expect(text).toMatch(/\d{1,2}:\d{2}/);
    expect(text).not.toMatch(/\d{1,2}:\d{2}:\d{2}/);
  });

  it('el ano solo cuando se pide', () => {
    expect(formatStudyDate(CAPTURED)).not.toContain('2026');
    expect(formatStudyDate(CAPTURED, true)).toContain('2026');
  });
});
