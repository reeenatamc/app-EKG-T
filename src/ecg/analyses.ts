import { useEffect } from 'react';
import { create } from 'zustand';

import type { EcgAnalysis, EcgAnalysisService } from '@/ecg/EcgAnalysisService';
import { httpEcgAnalysisService } from '@/ecg/HttpEcgAnalysisService';

/**
 * Analisis en curso y terminados.
 *
 * NO SE PERSISTE, y es deliberado. Un analisis es lo que el servidor sabe de un
 * estudio; guardarlo en el dispositivo crearia una segunda verdad que se queda
 * vieja en silencio. Lo que si persiste es la cola de subida, porque ahi el
 * dispositivo es el unico que tiene el dato.
 *
 * El sondeo vive aqui y no en las pantallas: una pantalla que se monta dos veces
 * no debe abrir dos sondeos sobre el mismo estudio.
 */

/**
 * Servicio en uso. Sustituirlo en la Etapa 5 es cambiar esta linea, y ninguna
 * pantalla se entera: todas hablan con EcgAnalysisService.
 */
const service: EcgAnalysisService = httpEcgAnalysisService;

/** Primera espera. Un analisis puede resolverse en un segundo y hay que verlo. */
const FIRST_POLL_MS = 1000;

/** Techo de la espera. Mas alla, el usuario nota que la pantalla va por detras. */
const MAX_POLL_MS = 15_000;

/**
 * Cuanto esperar antes de la consulta numero `attempt`.
 *
 * SE VA ESPACIANDO, y no por elegancia. Preguntar cada segundo estaba bien contra
 * la simulacion, que resolvia en cinco; contra el servidor real un estudio tarda
 * minutos -- medido: cinco, con los dos modelos en una CPU-- y eso son trescientas
 * peticiones y trescientas radios encendidas para una sola respuesta, en la
 * bateria de quien esta mirando.
 *
 * Las dos primeras van seguidas porque un analisis puede terminar enseguida y esa
 * es la unica forma de que se vea al momento. A partir de ahi se dobla hasta el
 * techo: sobre cinco minutos, unas veinticuatro consultas en vez de trescientas.
 *
 * Lo que se paga es que un resultado puede tardar hasta quince segundos en
 * aparecer despues de estar listo. Sobre una espera de cinco minutos, eso no se
 * nota; trescientas peticiones si.
 *
 * @param attempt Consulta que se va a hacer, empezando en cero.
 * @returns La espera, en milisegundos.
 */
export function pollDelayMs(attempt: number): number {
  const doublings = Math.max(0, attempt - 1);

  return Math.min(MAX_POLL_MS, FIRST_POLL_MS * 2 ** doublings);
}

interface AnalysesState {
  readonly byStudy: Readonly<Record<string, EcgAnalysis>>;
  /**
   * Estudios ya pedidos, para no pedirlos dos veces al remontar una pantalla.
   *
   * VIVE EN EL ESTADO Y NO EN UN `Set` DE MODULO, que es donde estaba. Un
   * conjunto a nivel de modulo es una variable global escondida: sobrevive a
   * todo, nadie puede reiniciarla y por tanto la deduplicacion no se podia
   * probar. Aqui ademas deja obvio que reintentar es olvidar en los dos sitios.
   *
   * Hace falta separado de `byStudy` porque la peticion es asincrona: entre
   * pedir y recibir no hay entrada en `byStudy`, y sin esto una pantalla que se
   * monta dos veces abriria dos peticiones sobre el mismo estudio.
   */
  readonly requested: Readonly<Record<string, true>>;
  /** Pide el analisis de un estudio si no se ha pedido ya. */
  readonly request: (studyId: string) => void;
  /** Vuelve a consultar el estado de un analisis. */
  readonly refresh: (studyId: string) => Promise<void>;
  /** Vuelve a pedir desde cero el analisis de un estudio. */
  readonly retry: (studyId: string) => void;
}

/**
 * Devuelve el registro sin una clave, sin tocar el original.
 *
 * @param record Registro de partida.
 * @param key Clave a olvidar.
 * @returns Un registro nuevo sin esa clave.
 */
function forget<T>(record: Readonly<Record<string, T>>, key: string): Readonly<Record<string, T>> {
  return Object.fromEntries(Object.entries(record).filter(([id]) => id !== key));
}

export const useAnalyses = create<AnalysesState>()((set, get) => ({
  byStudy: {},
  requested: {},

  request: (studyId) => {
    if (get().requested[studyId] === true) {
      return;
    }
    set((state) => ({ requested: { ...state.requested, [studyId]: true } }));

    void service.request(studyId).then((analysis) => {
      set((state) => ({ byStudy: { ...state.byStudy, [studyId]: analysis } }));
    });
  },

  refresh: async (studyId) => {
    const analysis = await service.get(studyId);
    if (analysis !== null) {
      set((state) => ({ byStudy: { ...state.byStudy, [studyId]: analysis } }));
    }
  },

  // Olvidar en los dos sitios y volver a pedir. Sin borrar de `requested`, la
  // peticion nueva se descartaria por duplicada y el estudio se quedaria sin
  // analisis para siempre: el fallo mas facil de cometer aqui.
  retry: (studyId) => {
    set((state) => ({
      byStudy: forget(state.byStudy, studyId),
      requested: forget(state.requested, studyId),
    }));

    get().request(studyId);
  },
}));

/**
 * Cierto si hay un analisis en marcha del que todavia se espera respuesta.
 *
 * Un analisis pedido y sin resolver es lo unico que se pierde de verdad al
 * cerrar sesion. La imagen no: esa vive en el servidor a nombre de quien la
 * envio. Lo que se pierde es poder recogerlo, porque al vaciar el historial la
 * aplicacion olvida el identificador remoto y ya no hay por donde preguntar.
 *
 * Un estudio que nunca se abrio no cuenta: no se le pidio analisis a nadie, asi
 * que no hay proceso que interrumpir. La regla coincide con lo que se ve en
 * pantalla, que es lo que hace que el aviso se entienda.
 *
 * @param analysis Analisis del estudio, o undefined si no se pidio.
 * @returns Cierto si se esta esperando su resultado.
 */
export function isAwaiting(analysis: EcgAnalysis | undefined): boolean {
  return analysis !== undefined && !isSettled(analysis);
}

/** Cierto cuando el analisis ya no va a cambiar solo. */
function isSettled(analysis: EcgAnalysis | undefined): boolean {
  return analysis?.status === 'ready' || analysis?.status === 'failed';
}

/**
 * Consulta un estudio una y otra vez, cada vez mas espaciado.
 *
 * ENCADENADO Y NO EN INTERVALO: la siguiente consulta se programa cuando la
 * anterior ha contestado, asi que una respuesta lenta no acumula peticiones
 * solapadas preguntando lo mismo.
 *
 * @param tick Una vuelta de consulta: uno o varios estudios.
 * @returns Funcion que detiene el sondeo.
 */
function startPolling(tick: () => Promise<void>): () => void {
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout>;
  // La consulta en vuelo no se puede cancelar, pero su continuacion si. Sin
  // esto, cerrar la pantalla mientras una respuesta viene de camino dejaria
  // programada una consulta mas que ya nadie limpia.
  let stopped = false;

  const schedule = (): void => {
    timer = setTimeout(() => {
      void tick().finally(() => {
        if (stopped) {
          return;
        }
        attempt += 1;
        schedule();
      });
    }, pollDelayMs(attempt));
  };

  schedule();

  return () => {
    stopped = true;
    clearTimeout(timer);
  };
}

/**
 * Los estudios cuyo analisis todavia puede cambiar.
 *
 * Un estudio sin analisis conocido cuenta como pendiente: o no se ha pedido aun,
 * o la respuesta no ha llegado, y en los dos casos hay que seguir preguntando.
 *
 * @param ids Identificadores remotos a considerar.
 * @param byStudy Analisis conocidos.
 * @returns Los que no estan resueltos, en el mismo orden.
 */
export function unsettledIds(
  ids: readonly string[],
  byStudy: Readonly<Record<string, EcgAnalysis>>,
): readonly string[] {
  return ids.filter((id) => !isSettled(byStudy[id]));
}

/**
 * Pide y sigue el analisis de todos los estudios enviados.
 *
 * ANTES EL ANALISIS SOLO SE PEDIA AL ABRIR EL ESTUDIO. La unica pantalla que lo
 * pedia era el detalle, asi que un estudio enviado y nunca abierto no llegaba a
 * procesarse: el servidor recibia la imagen y esperaba a una peticion que no
 * llegaba. Y el historial no podia decir en que estado estaba nada, porque no lo
 * sabia hasta que alguien entraba.
 *
 * Se monta una sola vez para toda la sesion, no por pantalla, para que el estado
 * se vea igual en el inicio y en el historial sin que cada una abra su sondeo.
 * Pedir es idempotente en los dos lados: el almacen no repite lo ya pedido y el
 * servidor devuelve el analisis existente.
 *
 * Un solo sondeo para todos, con el mismo espaciado que el de un estudio. Se
 * reinicia rapido cuando cambia el conjunto de pendientes: un estudio recien
 * enviado merece la primera consulta al segundo, no a los quince del techo.
 *
 * @param ids Identificadores remotos de los estudios enviados.
 */
export function useAnalysesFor(ids: readonly string[]): void {
  const request = useAnalyses((state) => state.request);
  const refresh = useAnalyses((state) => state.refresh);
  const idsKey = ids.join(',');
  // Una cadena y no una lista: el selector se evalua en cada cambio del almacen,
  // y una lista nueva cada vez haria renderizar por nada.
  const pendingKey = useAnalyses((state) => unsettledIds(ids, state.byStudy).join(','));

  useEffect(() => {
    splitKey(idsKey).forEach((id) => request(id));
  }, [idsKey, request]);

  useEffect(() => {
    const pending = splitKey(pendingKey);
    if (pending.length === 0) {
      return;
    }

    return startPolling(async () => {
      await Promise.all(pending.map((id) => refresh(id)));
    });
  }, [pendingKey, refresh]);
}

/** Deshace la clave de un conjunto de identificadores. */
function splitKey(key: string): readonly string[] {
  return key === '' ? [] : key.split(',');
}

/**
 * Sigue el analisis de un estudio hasta que termina.
 *
 * Pide el analisis al montar y sondea mientras no este resuelto. El sondeo se
 * para solo: un intervalo que sigue vivo despues de que el estudio este listo es
 * bateria y datos gastados en preguntar algo que ya se sabe.
 *
 * SE PIDE POR EL IDENTIFICADOR DEL SERVIDOR, no por el del dispositivo: es el
 * unico que el servidor conoce. Un estudio que todavia no se ha enviado no
 * tiene ninguno, y entonces aqui no se pide ni se sondea nada, porque no hay a
 * quien preguntar.
 *
 * @param studyId Identificador remoto del estudio, o null si aun no se envio.
 * @returns El analisis, o undefined mientras no haya llegado el primero.
 */
export function useAnalysis(studyId: string | null): EcgAnalysis | undefined {
  const analysis = useAnalyses((state) => (studyId === null ? undefined : state.byStudy[studyId]));
  const request = useAnalyses((state) => state.request);
  const refresh = useAnalyses((state) => state.refresh);

  useEffect(() => {
    if (studyId !== null) {
      request(studyId);
    }
  }, [request, studyId]);

  const settled = isSettled(analysis);

  useEffect(() => {
    if (settled || studyId === null) {
      return;
    }

    return startPolling(() => refresh(studyId));
  }, [refresh, settled, studyId]);

  return analysis;
}
