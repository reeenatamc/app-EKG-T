import { formatAnonymousId, normalizeAnonymousId } from '@/capture/study';

describe('formatAnonymousId', () => {
  it('compone prefijo, fecha y sufijo', () => {
    expect(formatAnonymousId(new Date(2026, 6, 29), '4k2m')).toBe('ECG-260729-4K2M');
  });

  it('rellena mes y dia a dos digitos', () => {
    expect(formatAnonymousId(new Date(2026, 0, 5), 'AB12')).toBe('ECG-260105-AB12');
  });
});

describe('normalizeAnonymousId', () => {
  // No impide teclear un apellido en mayusculas, y no pretende hacerlo. Lo que
  // hace es que el campo se comporte como un codigo, para que escribir un
  // nombre resulte antinatural antes incluso de leer la ayuda.
  it('deja solo mayusculas, digitos y guiones', () => {
    expect(normalizeAnonymousId('caso 42 / urgencias')).toBe('CASO42URGENCIAS');
  });

  it('quita acentos y espacios de un nombre escrito por costumbre', () => {
    expect(normalizeAnonymousId('María Pérez')).toBe('MARAPREZ');
  });

  it('corta los identificadores desmedidos', () => {
    expect(normalizeAnonymousId('A'.repeat(60))).toHaveLength(24);
  });

  it('conserva un codigo de registro con guiones', () => {
    expect(normalizeAnonymousId('hc-2026-0042')).toBe('HC-2026-0042');
  });
});
