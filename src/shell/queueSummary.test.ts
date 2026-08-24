import { HOME_TEXT } from '@/constants/shellText';
import { describePending, describeSaved, historyView } from '@/shell/queueSummary';

/**
 * Lo que se dice de la cola antes y despues de leer el disco.
 *
 * Los casos que importan son los de `hasHydrated` en falso. Los otros se
 * ejercitan cada vez que alguien abre la aplicacion; estos solo duran los
 * milisegundos de la rehidratacion, que es tiempo de sobra para ensenar una
 * respuesta equivocada y ninguno para que nadie la reproduzca a mano.
 */
describe('historyView', () => {
  it('no ensena nada mientras no se sabe, aunque la cola parezca vacia', () => {
    // El caso del fallo: sin hidratar, `count` es 0 porque el disco no ha
    // llegado, no porque no haya estudios. Invitar a capturar ahi es mentir.
    expect(historyView(false, 0)).toBe('loading');
  });

  it('sigue sin ensenar nada aunque ya hubiera estudios en memoria', () => {
    expect(historyView(false, 4)).toBe('loading');
  });

  it('invita a capturar cuando de verdad no hay ninguno', () => {
    expect(historyView(true, 0)).toBe('empty');
  });

  it('ensena la lista cuando hay estudios', () => {
    expect(historyView(true, 1)).toBe('list');
  });
});

describe('describePending', () => {
  it('no dice nada mientras no se sabe', () => {
    expect(describePending(false, 0)).toBeUndefined();
  });

  it('distingue ninguno, uno y varios', () => {
    expect(describePending(true, 0)).toBe(HOME_TEXT.pendingEmpty);
    expect(describePending(true, 1)).toBe(HOME_TEXT.pendingOne);
    expect(describePending(true, 3)).toBe(`3 ${HOME_TEXT.pendingMany}`);
  });
});

describe('describeSaved', () => {
  it('no dice nada mientras no se sabe', () => {
    expect(describeSaved(false, 0)).toBeUndefined();
  });

  it('distingue ninguno, uno y varios', () => {
    expect(describeSaved(true, 0)).toBe(HOME_TEXT.recentEmpty);
    expect(describeSaved(true, 1)).toBe(HOME_TEXT.recentOne);
    expect(describeSaved(true, 5)).toBe(`5 ${HOME_TEXT.recentMany}`);
  });

  it('el singular no duplica la cifra', () => {
    // `recentOne` ya trae su «1» dentro. Tratar el uno como el resto daria
    // "1 1 guardado", que es el fallo clasico de este tipo de plural.
    expect(describeSaved(true, 1)).not.toMatch(/1\s+1/);
    expect(describePending(true, 1)).not.toMatch(/1\s+1/);
  });
});
