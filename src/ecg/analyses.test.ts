import type { AnalysisStatus, EcgAnalysis } from '@/ecg/EcgAnalysisService';
import { isAwaiting, pollDelayMs, unsettledIds, useAnalyses } from '@/ecg/analyses';

/**
 * Peticion, deduplicacion y reintento del analisis.
 *
 * Se prueba el almacen y no una funcion suelta porque lo que puede romperse es
 * la coordinacion entre sus dos registros: `byStudy` guarda lo que se sabe y
 * `requested` guarda lo que ya se pidio. Olvidar en uno y no en el otro deja un
 * estudio sin analisis para siempre, y eso no se ve en ninguna funcion pura.
 *
 * Mientras `requested` era un `Set` a nivel de modulo esto no se podia escribir:
 * no habia forma de devolver el almacen a su estado inicial entre pruebas.
 */

/**
 * El servicio se sustituye a proposito.
 *
 * Esta suite prueba la coordinacion del almacen, no de donde salen los datos.
 * Cuando el almacen paso de la simulacion al servidor siguio en verde, pero por
 * otro camino: sin credencial en el entorno de pruebas, la peticion devolvia un
 * analisis fallido al instante y el estado quedaba escrito igual. Verde por el
 * motivo equivocado. Con el servicio fijado aqui, lo que se prueba no depende de
 * cual este enchufado.
 */
jest.mock('@/ecg/HttpEcgAnalysisService', () => ({
  httpEcgAnalysisService: {
    request: jest.fn(async (studyId: string) => ({
      studyId,
      status: 'queued',
      signal: null,
      measurements: null,
      observations: [],
      failure: null,
      completedAt: null,
    })),
    get: jest.fn(async () => null),
  },
}));

/** Deja correr las microtareas pendientes de la peticion. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  useAnalyses.setState({ byStudy: {}, requested: {} });
});

describe('request', () => {
  it('deja el analisis en el almacen', async () => {
    useAnalyses.getState().request('a');
    await flush();

    expect(useAnalyses.getState().byStudy.a).toBeDefined();
  });

  it('la segunda peticion del mismo estudio no vuelve a tocar el estado', async () => {
    useAnalyses.getState().request('a');
    await flush();
    const first = useAnalyses.getState().byStudy;

    useAnalyses.getState().request('a');
    await flush();

    // Misma referencia: la llamada repetida salio antes de escribir nada. Es lo
    // que impide que una pantalla montada dos veces abra dos peticiones.
    expect(useAnalyses.getState().byStudy).toBe(first);
  });
});

describe('retry', () => {
  it('olvida el analisis en el acto', async () => {
    useAnalyses.getState().request('a');
    await flush();

    useAnalyses.getState().retry('a');

    // Sincrono a proposito: la pantalla tiene que dejar de ensenar el fallo en
    // cuanto se pulsa, no cuando conteste el servidor.
    expect(useAnalyses.getState().byStudy.a).toBeUndefined();
  });

  it('vuelve a pedirlo, o sea que tambien lo olvida de los ya pedidos', async () => {
    useAnalyses.getState().request('a');
    await flush();

    useAnalyses.getState().retry('a');
    await flush();

    // EL CASO QUE IMPORTA. Si `retry` limpiara solo `byStudy`, la peticion
    // nueva se descartaria por duplicada y el estudio se quedaria sin analisis
    // para siempre, ensenando «en cola» hasta que se cierre la aplicacion.
    expect(useAnalyses.getState().byStudy.a).toBeDefined();
  });

  it('no toca los demas estudios', async () => {
    useAnalyses.getState().request('a');
    useAnalyses.getState().request('b');
    await flush();

    useAnalyses.getState().retry('a');

    expect(useAnalyses.getState().byStudy.b).toBeDefined();
    expect(useAnalyses.getState().requested.b).toBe(true);
  });
});

describe('isAwaiting', () => {
  // Un analisis pedido y sin resolver es lo unico que se pierde de verdad al
  // cerrar sesion: la imagen vive en el servidor, pero al vaciar el historial la
  // aplicacion olvida el identificador remoto y ya no hay por donde recogerlo.
  const analysisWith = (status: AnalysisStatus): EcgAnalysis => ({
    studyId: 's-1',
    status,
    signal: null,
    measurements: null,
    observations: [],
    failure: null,
    completedAt: null,
  });

  it('un estudio que nunca se abrio no espera nada', () => {
    // No se le pidio analisis a nadie, asi que no hay proceso que interrumpir.
    expect(isAwaiting(undefined)).toBe(false);
  });

  it('en cola y procesando si esperan', () => {
    expect(isAwaiting(analysisWith('queued'))).toBe(true);
    expect(isAwaiting(analysisWith('processing'))).toBe(true);
  });

  it('listo y fallido ya no esperan nada', () => {
    expect(isAwaiting(analysisWith('ready'))).toBe(false);
    expect(isAwaiting(analysisWith('failed'))).toBe(false);
  });
});

describe('espaciado del sondeo', () => {
  /** Consultas que se harian esperando `seconds` segundos a un resultado. */
  function pollsWithin(seconds: number): number {
    let elapsed = 0;
    let attempt = 0;

    while (elapsed < seconds * 1000) {
      elapsed += pollDelayMs(attempt);
      attempt += 1;
    }

    return attempt;
  }

  it('las cinco primeras consultas van cada segundo', () => {
    // Un analisis puede resolverse enseguida -- la digitalizacion sola tarda
    // unos quince segundos-- y hay que verlo al momento.
    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect(pollDelayMs(attempt)).toBe(1000);
    }
  });

  it('pasadas las cinco primeras, cada dos segundos', () => {
    expect(pollDelayMs(5)).toBe(2000);
    expect(pollDelayMs(9)).toBe(2000);
  });

  it('pasados veinte segundos de sondeo, cada cinco', () => {
    // A los cinco segundos de las cinco primeras consultas se suman ocho mas de
    // dos segundos (dieciseis) antes de cruzar los veinte: la consulta trece es
    // la primera que cae del otro lado del umbral.
    expect(pollDelayMs(13)).toBe(5000);
    expect(pollDelayMs(100)).toBe(5000);
  });

  it('el sondeo no se queda preguntando cada segundo para siempre', () => {
    // Contra un estudio que tarda minutos, preguntar cada segundo son
    // cientos de peticiones y otras tantas radios encendidas en la bateria
    // de quien esta mirando. Espaciado, cinco minutos son unas setenta.
    expect(pollsWithin(300)).toBeLessThan(80);
  });

  it('un resultado inmediato no espera un tiempo raro', () => {
    // El coste del espaciado es que un resultado listo tarda en verse. Que ese
    // coste tenga techo es justo lo que hace aceptable el cambio.
    expect(pollDelayMs(0)).toBeLessThanOrEqual(1000);
  });
});

describe('unsettledIds', () => {
  const analysis = (studyId: string, status: AnalysisStatus): EcgAnalysis => ({
    studyId,
    status,
    signal: null,
    measurements: null,
    observations: [],
    failure: null,
    completedAt: null,
  });

  it('lo que esta en cola o procesando sigue pendiente', () => {
    const byStudy = { a: analysis('a', 'queued'), b: analysis('b', 'processing') };

    expect(unsettledIds(['a', 'b'], byStudy)).toEqual(['a', 'b']);
  });

  it('lo listo y lo fallido ya no se consulta', () => {
    const byStudy = { a: analysis('a', 'ready'), b: analysis('b', 'failed') };

    expect(unsettledIds(['a', 'b'], byStudy)).toEqual([]);
  });

  it('UN ESTUDIO SIN ANALISIS CONOCIDO CUENTA COMO PENDIENTE', () => {
    // Es el caso que motivo el sondeo de la sesion: enviado, nunca abierto, y por
    // eso sin analisis en el almacen. Tratarlo como resuelto lo dejaria asi para
    // siempre.
    expect(unsettledIds(['nuevo'], {})).toEqual(['nuevo']);
  });
});
