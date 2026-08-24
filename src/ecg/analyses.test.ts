import { useAnalyses } from '@/ecg/analyses';
import { cancelMockAnalyses } from '@/ecg/MockEcgAnalysisService';

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

/** Deja correr las microtareas pendientes de la peticion simulada. */
function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

afterEach(() => {
  cancelMockAnalyses();
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
