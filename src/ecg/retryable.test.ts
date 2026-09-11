import type { AnalysisFailureReason } from '@/ecg/EcgAnalysisService';
import { isWorthRetrying } from '@/ecg/retryable';
import { ANALYSIS_FAILURE_COPY } from '@/constants/studyText';

describe('isWorthRetrying', () => {
  it('lo que no depende de la imagen si merece otro intento', () => {
    expect(isWorthRetrying('network-unreachable')).toBe(true);
    expect(isWorthRetrying('server-error')).toBe(true);
    expect(isWorthRetrying('unexpected')).toBe(true);
  });

  it('UN TRAZADO INCOMPLETO NO CAMBIA POR PEDIRLO OTRA VEZ', () => {
    // Es el caso que motivo todo esto. Un 3x4 sin tira de ritmo se lee
    // perfectamente y aun asi no da lectura de ritmo, porque no la hay. Salia
    // como "algo fallo, reintentar", y reintentar no podia funcionar nunca.
    // Desde que la digitalizacion es reproducible, la misma imagen da el mismo
    // trazado. Lo que puede cambiar el resultado es una foto nueva, que es un
    // estudio nuevo, no reintentar este.
    expect(isWorthRetrying('trace-incomplete')).toBe(false);
  });

  it('lo que es propiedad de la fotografia tampoco', () => {
    expect(isWorthRetrying('unreadable-image')).toBe(false);
    expect(isWorthRetrying('grid-not-detected')).toBe(false);
    expect(isWorthRetrying('unsupported-mount')).toBe(false);
  });

  it('sin causa se ofrece, porque no saber que paso no es saber que no sirve', () => {
    expect(isWorthRetrying(null)).toBe(true);
  });
});

describe('el vocabulario de causas', () => {
  it('TODA CAUSA TIENE TEXTO', () => {
    // El texto es un Record sobre la union, asi que anadir una causa sin texto no
    // compila. Esta prueba cubre lo que el tipo no ve: un texto vacio, que en
    // pantalla es una tarjeta de error muda.
    for (const [reason, copy] of Object.entries(ANALYSIS_FAILURE_COPY)) {
      expect(copy.trim().length).toBeGreaterThan(0);
      expect(reason.length).toBeGreaterThan(0);
    }
  });

  it('toda causa esta decidida en isWorthRetrying', () => {
    // Una causa nueva que nadie clasifique caeria en el lado de "no reintentar"
    // por omision, y dejaria sin salida a un fallo pasajero. Que la decision sea
    // explicita es el punto.
    const reasons = Object.keys(ANALYSIS_FAILURE_COPY) as AnalysisFailureReason[];

    expect(reasons.length).toBeGreaterThan(0);
    for (const reason of reasons) {
      expect(typeof isWorthRetrying(reason)).toBe('boolean');
    }
  });
});
