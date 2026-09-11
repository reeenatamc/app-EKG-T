import { formatStudyDate } from '@/capture/studyDate';

/** Un instante construido en hora local, para que la prueba no dependa de la zona. */
function localIso(year: number, month: number, day: number, hour: number, minute: number): string {
  return new Date(year, month, day, hour, minute, 6).toISOString();
}

describe('formatStudyDate', () => {
  it('corta: dia, mes abreviado y hora a dos cifras, sin segundos', () => {
    expect(formatStudyDate(localIso(2026, 8, 11, 2, 42))).toBe('11 sept · 02:42');
  });

  it('larga: con el mes entero y el ano, para el detalle', () => {
    expect(formatStudyDate(localIso(2026, 8, 11, 14, 5), true)).toBe(
      '11 de septiembre de 2026 · 14:05',
    );
  });

  it('los demas meses van a tres letras', () => {
    expect(formatStudyDate(localIso(2026, 0, 3, 9, 0))).toBe('3 ene · 09:00');
    expect(formatStudyDate(localIso(2026, 11, 24, 23, 59))).toBe('24 dic · 23:59');
  });

  it('NO DEPENDE DE QUE EL MOTOR TRAIGA ICU', () => {
    // La primera version usaba toLocaleString con opciones, que falla en silencio
    // donde el motor no trae ICU completo. Esta no toca Intl en absoluto.
    const spy = jest.spyOn(Date.prototype, 'toLocaleString');

    formatStudyDate(localIso(2026, 8, 11, 2, 42), true);

    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
