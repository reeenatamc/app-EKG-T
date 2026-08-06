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
  /** Pide el analisis de un estudio si no se ha pedido ya. */
  readonly request: (studyId: string) => void;
  /** Vuelve a consultar el estado de un analisis. */
  readonly refresh: (studyId: string) => Promise<void>;
}

/** Estudios ya pedidos, para no pedirlos dos veces al remontar una pantalla. */
const requested = new Set<string>();

export const useAnalyses = create<AnalysesState>()((set) => ({
  byStudy: {},

  request: (studyId) => {
    if (requested.has(studyId)) {
      return;
    }
    requested.add(studyId);

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
