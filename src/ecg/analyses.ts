import { useEffect } from 'react';
import { create } from 'zustand';

import type { EcgAnalysis, EcgAnalysisService } from '@/ecg/EcgAnalysisService';
import { mockEcgAnalysisService } from '@/ecg/MockEcgAnalysisService';

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
const service: EcgAnalysisService = mockEcgAnalysisService;

/** Cada cuanto se pregunta al servidor mientras un analisis no termina. */
const POLL_INTERVAL_MS = 1000;

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

/** Cierto cuando el analisis ya no va a cambiar solo. */
function isSettled(analysis: EcgAnalysis | undefined): boolean {
  return analysis?.status === 'ready' || analysis?.status === 'failed';
}

/**
 * Sigue el analisis de un estudio hasta que termina.
 *
 * Pide el analisis al montar y sondea mientras no este resuelto. El sondeo se
 * para solo: un intervalo que sigue vivo despues de que el estudio este listo es
 * bateria y datos gastados en preguntar algo que ya se sabe.
 *
 * @param studyId Identificador del estudio.
 * @returns El analisis, o undefined mientras no haya llegado el primero.
 */
export function useAnalysis(studyId: string): EcgAnalysis | undefined {
  const analysis = useAnalyses((state) => state.byStudy[studyId]);
  const request = useAnalyses((state) => state.request);
  const refresh = useAnalyses((state) => state.refresh);

  useEffect(() => {
    request(studyId);
  }, [request, studyId]);

  const settled = isSettled(analysis);

  useEffect(() => {
    if (settled) {
      return;
    }

    const interval = setInterval(() => void refresh(studyId), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh, settled, studyId]);

  return analysis;
}
