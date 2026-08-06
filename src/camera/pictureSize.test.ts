import { parsePictureSize, selectLargestPictureSize } from '@/camera/pictureSize';

describe('parsePictureSize', () => {
  it('interpreta el formato ancho x alto', () => {
    expect(parsePictureSize('4000x3000')).toEqual({ width: 4000, height: 3000 });
  });

  it('ignora los nombres de preajuste que publica iOS', () => {
    expect(parsePictureSize('photo')).toBeNull();
    expect(parsePictureSize('hd1920x1080')).toBeNull();
  });

  it('rechaza una dimension nula', () => {
    expect(parsePictureSize('0x3000')).toBeNull();
  });
});

describe('selectLargestPictureSize', () => {
  // El caso que motiva el modulo: sin elegir, la camara usa su tamano por
  // defecto, que aqui seria el de en medio y costaria mas de la mitad de los
  // pixeles por milimetro.
  it('elige la resolucion de mayor area', () => {
    const available = ['1280x720', '1920x1080', '4000x3000', '3264x2448'];

    expect(selectLargestPictureSize(available)).toBe('4000x3000');
  });

  it('prefiere el area sobre el ancho', () => {
    // 4:3 de 12 MP frente a 16:9 de 9 MP: el segundo es mas ancho pero recorta
    // arriba y abajo en vez de anadir detalle.
    expect(selectLargestPictureSize(['4032x2268', '4000x3000'])).toBe('4000x3000');
  });

  it('devuelve null cuando ninguna resolucion es interpretable', () => {
    expect(selectLargestPictureSize(['photo', 'high'])).toBeNull();
  });

  it('devuelve null con la lista vacia', () => {
    expect(selectLargestPictureSize([])).toBeNull();
  });
});
