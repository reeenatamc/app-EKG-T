import { reviewCopyFor } from '@/capture/reviewCopy';
import { REVIEW_TEXT } from '@/constants/captureText';

describe('reviewCopyFor', () => {
  it('a la camara se le pide llevar las esquinas al borde del papel', () => {
    // Es lo correcto ahi: alrededor de la hoja hay mesa, y quitarla ayuda.
    expect(reviewCopyFor('camera').hint).toContain('borde del papel');
  });

  it('A LA GALERIA NO SE LE PIDE RECORTAR', () => {
    // La instruccion de la camara es daniña aqui. Medido sobre un registro de
    // 1800x649: entero se lee como standard_3x4 con coste 0.034, el mejor del
    // corpus; ajustado a la rejilla pasa a precordial_3x2. El montaje decide que
    // traza se llama que derivacion, asi que eso no es perder calidad: es leer
    // otro electrocardiograma.
    const hint = reviewCopyFor('gallery').hint;

    expect(hint).not.toContain('borde del papel');
    expect(hint).toContain('dejalas donde estan');
  });

  it('los dos origenes dicen algo, y algo distinto', () => {
    const camera = reviewCopyFor('camera');
    const gallery = reviewCopyFor('gallery');

    for (const copy of [camera, gallery]) {
      expect(copy.title.trim().length).toBeGreaterThan(0);
      expect(copy.hint.trim().length).toBeGreaterThan(0);
      expect(copy.reset.trim().length).toBeGreaterThan(0);
    }
    expect(camera.title).not.toBe(gallery.title);
    expect(camera.hint).not.toBe(gallery.hint);
  });

  it('el boton de reinicio no nombra un encuadre que no hubo', () => {
    // En la galeria nadie encuadro nada: se eligio un archivo.
    expect(reviewCopyFor('camera').reset).toBe(REVIEW_TEXT.reset);
    expect(reviewCopyFor('gallery').reset).not.toContain('encuadre');
  });
});
