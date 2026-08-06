import type { Session } from '@/auth/AuthService';
import { displayNameFrom, greetingFor, longDate, welcomeLine } from '@/shell/greeting';

/** Sesion minima: solo importa el correo, que es de donde sale el nombre. */
function sessionWith(email: string): Session {
  return { userId: 'u-1', email, role: 'professional' };
}

/** Una fecha con la hora pedida. El dia da igual; el saludo solo mira la hora. */
function at(hour: number): Date {
  return new Date(2026, 6, 29, hour, 30);
}

describe('el saludo cambia con la hora', () => {
  it.each([
    [6, 'Buenos días'],
    [9, 'Buenos días'],
    [11, 'Buenos días'],
    [12, 'Buenas tardes'],
    [17, 'Buenas tardes'],
    [19, 'Buenas tardes'],
    [20, 'Buenas noches'],
    [23, 'Buenas noches'],
    [3, 'Buenas noches'],
    [5, 'Buenas noches'],
  ])('a las %i dice "%s"', (hour, expected) => {
    expect(greetingFor(at(hour))).toBe(expected);
  });

  it('los limites caen del lado correcto', () => {
    // Las 11:59 siguen siendo mañana y las 12:00 ya son tarde. Un saludo que
    // cambia un minuto antes de tiempo se nota mas de lo que parece.
    expect(greetingFor(new Date(2026, 6, 29, 11, 59))).toBe('Buenos días');
    expect(greetingFor(new Date(2026, 6, 29, 12, 0))).toBe('Buenas tardes');
    expect(greetingFor(new Date(2026, 6, 29, 19, 59))).toBe('Buenas tardes');
    expect(greetingFor(new Date(2026, 6, 29, 20, 0))).toBe('Buenas noches');
  });
});

describe('el nombre sale del correo, que es el unico dato que hay', () => {
  it('toma el primer segmento y lo capitaliza', () => {
    expect(displayNameFrom(sessionWith('renata@ejemplo.com'))).toBe('Renata');
    expect(displayNameFrom(sessionWith('RENATA@ejemplo.com'))).toBe('Renata');
  });

  it('corta por los separadores habituales de un correo compuesto', () => {
    expect(displayNameFrom(sessionWith('renata.mc@ejemplo.com'))).toBe('Renata');
    expect(displayNameFrom(sessionWith('renata_mc@ejemplo.com'))).toBe('Renata');
    expect(displayNameFrom(sessionWith('renata-mc@ejemplo.com'))).toBe('Renata');
    expect(displayNameFrom(sessionWith('renata+pruebas@ejemplo.com'))).toBe('Renata');
  });

  it('respeta los acentos y la ene', () => {
    expect(displayNameFrom(sessionWith('ángela@ejemplo.com'))).toBe('Ángela');
    expect(displayNameFrom(sessionWith('nuño@ejemplo.com'))).toBe('Nuño');
  });

  it('devuelve null cuando no hay de donde sacarlo', () => {
    // Sin sesion, con el correo vacio, o con un correo que empieza por el
    // separador. En los tres casos se saluda sin nombre, que es mejor que
    // saludar a nadie con un hueco.
    expect(displayNameFrom(null)).toBeNull();
    expect(displayNameFrom(sessionWith(''))).toBeNull();
    expect(displayNameFrom(sessionWith('@ejemplo.com'))).toBeNull();
    expect(displayNameFrom(sessionWith('.oculto@ejemplo.com'))).toBeNull();
  });
});

describe('la linea completa', () => {
  it('junta saludo y nombre', () => {
    expect(welcomeLine(sessionWith('renata@ejemplo.com'), at(15))).toBe('Buenas tardes, Renata');
    expect(welcomeLine(sessionWith('renata@ejemplo.com'), at(8))).toBe('Buenos días, Renata');
  });

  it('sin nombre, el saludo va solo y sin coma colgando', () => {
    expect(welcomeLine(null, at(22))).toBe('Buenas noches');
  });
});

describe('la fecha larga se compone a mano, sin depender de ICU', () => {
  it('escribe dia de la semana, numero y mes en espanol', () => {
    // 29 de julio de 2026 cae en miercoles.
    expect(longDate(new Date(2026, 6, 29))).toBe('miércoles 29 de julio');
    expect(longDate(new Date(2026, 0, 1))).toBe('jueves 1 de enero');
    expect(longDate(new Date(2026, 11, 31))).toBe('jueves 31 de diciembre');
  });

  it('cubre los siete dias y los doce meses', () => {
    // Si alguna tabla se quedara corta, aqui saldria una cadena con un hueco.
    for (let day = 1; day <= 7; day += 1) {
      expect(longDate(new Date(2026, 5, day))).not.toMatch(/\s{2}|^\s|\sde\s$/);
    }
    for (let month = 0; month < 12; month += 1) {
      expect(longDate(new Date(2026, month, 15))).not.toMatch(/\s{2}|de\s*$/);
    }
  });
});
