import { resolveBack } from '@/shell/navigation';

/**
 * Salida de las pantallas apiladas.
 *
 * La rama que importa es la segunda. La primera se ejercita cada vez que alguien
 * usa la aplicacion; la de reemplazo solo se alcanza entrando por enlace
 * profundo, o sea el caso que nadie prueba a mano y en el que la pantalla se
 * quedaba sin salida.
 */
describe('resolveBack', () => {
  it('retrocede cuando hay pila debajo', () => {
    expect(resolveBack(true, '/history')).toEqual({ kind: 'back' });
  });

  it('cae a la ruta de respaldo cuando la pila esta vacia', () => {
    expect(resolveBack(false, '/history')).toEqual({ kind: 'replace', route: '/history' });
  });

  it('ignora la ruta de respaldo mientras se pueda retroceder', () => {
    // Da igual que respaldo se pase: con pila debajo, retroceder conserva el
    // sitio del que se venia y la ruta fija lo perderia.
    expect(resolveBack(true, '/home')).toEqual(resolveBack(true, '/profile'));
  });
});
