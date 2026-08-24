import { keyboardBehavior } from '@/shell/keyboard';

describe('keyboardBehavior', () => {
  it('aparta el contenido en iOS, donde el teclado se superpone', () => {
    expect(keyboardBehavior('ios')).toBe('padding');
  });

  it('no aparta nada en Android, que ya encoge la ventana', () => {
    // Con relleno propio ademas del «resize» del sistema, el contenido subiria
    // el doble de lo que mide el teclado.
    expect(keyboardBehavior('android')).toBeUndefined();
  });

  it('trata cualquier otra plataforma como Android', () => {
    // Web y macOS tampoco superponen el teclado sobre el diseno.
    expect(keyboardBehavior('web')).toBeUndefined();
  });
});
