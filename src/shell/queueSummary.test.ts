import { historyView } from '@/shell/queueSummary';

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
