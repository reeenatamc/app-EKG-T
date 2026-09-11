import { safePadding } from '@/shell/safePadding';

const NOTCHED = { top: 44, bottom: 24, left: 0, right: 0 };

describe('safePadding', () => {
  it('EL AIRE SE SUMA A LA ZONA DEL SISTEMA, NO LA SUSTITUYE', () => {
    // El fallo que corrige: dieciseis puntos fijos desde el borde dejaban el boton
    // de volver debajo de una barra de notificaciones que mide cuarenta y cuatro.
    expect(safePadding(NOTCHED, 16, 16)).toEqual({ paddingTop: 60, paddingBottom: 40 });
  });

  it('sin zonas del sistema queda solo el aire pedido', () => {
    expect(safePadding({ top: 0, bottom: 0, left: 0, right: 0 }, 16, 24)).toEqual({
      paddingTop: 16,
      paddingBottom: 24,
    });
  });
});
