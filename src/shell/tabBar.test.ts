import { CAPTURE_SLOT, slotForPath, slotOffset, slotWidth } from '@/shell/tabBar';

describe('slotForPath', () => {
  it('cada pestana tiene su hueco', () => {
    expect(slotForPath('/home')).toBe(0);
    expect(slotForPath('/history')).toBe(1);
    expect(slotForPath('/profile')).toBe(3);
  });

  it('LA BURBUJA NUNCA SE POSA EN CAPTURAR', () => {
    // Capturar abre la camara a pantalla completa, no es una seccion. Si la
    // burbuja fuese alli, al volver de la camara marcaria un sitio donde no se esta.
    expect(CAPTURE_SLOT).toBe(2);
    expect(slotForPath('/capture')).toBeNull();
  });

  it('una ruta que no es pestana no tiene hueco', () => {
    expect(slotForPath('/study/abc')).toBeNull();
    expect(slotForPath('/settings')).toBeNull();
  });
});

describe('geometria de los huecos', () => {
  // Fila de 400 con 4 de relleno y 4 de espacio: 400 - 8 - 12 = 380 entre cuatro.
  const WIDTH = slotWidth(400, 4, 4);

  it('reparte el ancho entre los cuatro huecos', () => {
    expect(WIDTH).toBe(95);
  });

  it('el ultimo hueco acaba justo en el relleno derecho', () => {
    expect(slotOffset(3, WIDTH, 4, 4) + WIDTH).toBe(400 - 4);
  });

  it('A MITAD DE VIAJE LA BURBUJA CAE ENTRE LAS DOS PESTANAS', () => {
    // El hueco es fraccionario mientras el muelle la lleva de una a otra.
    const from = slotOffset(0, WIDTH, 4, 4);
    const to = slotOffset(1, WIDTH, 4, 4);

    expect(slotOffset(0.5, WIDTH, 4, 4)).toBe((from + to) / 2);
  });

  it('una fila todavia sin medir no da anchos negativos', () => {
    expect(slotWidth(0, 4, 4)).toBe(0);
  });
});
